import { Injectable, Logger, Optional } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ImportStats } from '../../interfaces/import-types';
import { ProjectIdAssignerService } from './project-id-assigner.service';
import { ExistingIdCollisionService } from './existing-id-collision.service';

@Injectable()
export class ImportRowProcessorService {
  private readonly logger = new Logger(ImportRowProcessorService.name);
  constructor(
    private readonly testEventDupService: TestEventDuplicateService,
    private readonly idMapRegistry: IdMapRegistryService,
    @Optional() private readonly projectIdAssigner?: ProjectIdAssignerService,
    @Optional()
    private readonly existingIdCollision?: ExistingIdCollisionService
  ) {}

  /**
   * Pre-process a materialized row before persistence. Returns `true` when
   * the caller should skip persisting this row (duplicate or early-skip),
   * otherwise `false`.
   */
  async preProcessRow(params: {
    raw: Record<string, unknown>;
    materialized: Record<string, unknown>;
    meta: EntityMetadata;
    name: string;
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string };
    existingIds: Set<unknown> | null;
    existingCompositeEventMap: Map<string, unknown> | null;
    ctx: {
      exportedProjectId: unknown;
      newProjectId: unknown;
      stats: Record<string, ImportStats>;
      idMaps: Record<string, Map<unknown, unknown>>;
    };
  }): Promise<boolean> {
    const {
      raw,
      materialized,
      meta,
      name,
      pkInfo,
      existingIds,
      existingCompositeEventMap,
      ctx
    } = params;

    // Assign project id if applicable (delegated)
    this.projectIdAssigner?.assignIfApplicable({
      materialized,
      meta,
      newProjectId: ctx.newProjectId
    });

    // Special-case TestEventEntity: drop old primary key when single-column PK
    if (
      meta.name === 'TestEventEntity' &&
      pkInfo.primaryIsSingle &&
      pkInfo.primaryKeyProp
    ) {
      delete materialized[pkInfo.primaryKeyProp];
    }

    // Delegate duplicate detection to TestEventDuplicateService
    if (
      this.testEventDupService.handleDuplicate(
        meta,
        raw,
        materialized,
        existingCompositeEventMap,
        pkInfo
      )
    ) {
      if (process.env.IMPORT_DEBUG) {
        this.logger.debug(
          `[IMPORT_DEBUG] Duplicate detected for ${meta.name}, allowing insertion (no skip).`
        );
      }
      // Do not return true; continue to allow persistence flow
    }

    // Existing ID collision handling (delegated)
    if (pkInfo.primaryIsSingle && existingIds && pkInfo.primaryKeyProp) {
      const pkVal = materialized[pkInfo.primaryKeyProp];
      if (pkVal != null && existingIds.has(pkVal)) {
        const rawOldPk = raw[pkInfo.primaryKeyProp];
        const defaultUpsertEligible = new Set([
          'ApplicationSettingEntity',
          'AuthenticationSettingEntity',
          'BrowserSettingEntity',
          'RecordingEntity',
          'SpecEntity',
          'ItemDefEntity'
        ]);
        const shouldSkip = this.existingIdCollision
          ? this.existingIdCollision.handleCollision({
              metaName: meta.name,
              pkVal,
              rawPkVal: rawOldPk,
              idMap: this.idMapRegistry
                .ensure(name)
                .set.bind(this.idMapRegistry.ensure(name)),
              incrementSkipStat: () => ctx.stats[name].skipped++,
              importDebug: Boolean(process.env.IMPORT_DEBUG)
            })
          : (() => {
              if (!defaultUpsertEligible.has(meta.name)) {
                if (rawOldPk != null)
                  this.idMapRegistry.ensure(name).set(rawOldPk, pkVal);
                ctx.stats[name].skipped++;
                if (process.env.IMPORT_DEBUG) {
                  this.logger.debug(
                    `[IMPORT_DEBUG] Early skip (fallback) due to existingId collision for ${meta.name} pkVal=${String(pkVal)}`
                  );
                }
                return true;
              }
              if (process.env.IMPORT_DEBUG) {
                this.logger.debug(
                  `[IMPORT_DEBUG] Collision on pk for upsert-eligible ${meta.name} (fallback), allowing through to persistence.`
                );
              }
              return false;
            })();

        if (shouldSkip) return true;
        // otherwise allow persistence to perform upsert
      }
    }

    return false;
  }
}
