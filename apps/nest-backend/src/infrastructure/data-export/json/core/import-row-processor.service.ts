import { Injectable, Logger } from '@nestjs/common';
import { EntityMetadata } from 'typeorm';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ImportStats } from '../../interfaces/import-types';

@Injectable()
export class ImportRowProcessorService {
  private readonly logger = new Logger(ImportRowProcessorService.name);
  constructor(
    private readonly testEventDupService: TestEventDuplicateService,
    private readonly idMapRegistry: IdMapRegistryService
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

    // Assign project id if applicable
    if (meta.name !== 'ProjectEntity' && ctx.newProjectId != null) {
      if ('projectId' in materialized) {
        materialized['projectId'] = ctx.newProjectId;
      }
    } else if (meta.name !== 'ProjectEntity' && ctx.newProjectId == null) {
      this.logger.debug(
        `Import order warning: importing ${meta.name} before new ProjectEntity primary key established.`
      );
    }

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
        pkInfo,
        ctx.stats[name]
      )
    ) {
      if (process.env.IMPORT_DEBUG) {
        this.logger.debug(
          `[IMPORT_DEBUG] Duplicate detected for ${meta.name}, composite key skip.`
        );
      }
      return true; // skip
    }

    // Existing ID collision handling
    if (pkInfo.primaryIsSingle && existingIds && pkInfo.primaryKeyProp) {
      const pkVal = materialized[pkInfo.primaryKeyProp];
      if (pkVal != null && existingIds.has(pkVal)) {
        const upsertEligible = new Set([
          'ApplicationSettingEntity',
          'AuthenticationSettingEntity',
          'BrowserSettingEntity',
          'RecordingEntity',
          'SpecEntity',
          'ItemDefEntity'
        ]);
        if (!upsertEligible.has(meta.name)) {
          const oldPk = raw[pkInfo.primaryKeyProp];
          if (oldPk != null) this.idMapRegistry.ensure(name).set(oldPk, pkVal);
          ctx.stats[name].skipped++;
          if (process.env.IMPORT_DEBUG) {
            this.logger.debug(
              `[IMPORT_DEBUG] Early skip due to existingId collision for ${meta.name} pkVal=${String(pkVal)}`
            );
          }
          return true; // skip
        }
        if (process.env.IMPORT_DEBUG) {
          this.logger.debug(
            `[IMPORT_DEBUG] Collision on pk for upsert-eligible ${meta.name} pkVal=${String(pkVal)} allowing through to persistence.`
          );
        }
        // allow persistence to perform upsert
      }
    }

    return false;
  }
}
