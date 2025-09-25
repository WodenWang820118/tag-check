import { Injectable, Logger } from '@nestjs/common';
import {
  EntityMetadata,
  Repository,
  ObjectLiteral,
  DataSource,
  EntityManager
} from 'typeorm';
import { RowMaterializerService } from './row-materializer.service';
import { RelationMapperService } from './relation-mapper.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { ImportStats } from '../../interfaces/import-types';
import { PrimaryKeyService } from './primary-key.service';
import { ProjectImportService } from './project-import.service';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { EntityPersistenceService } from './entity-persistence.service';

@Injectable()
export class EntityImportService {
  private readonly logger = new Logger(EntityImportService.name);
  constructor(
    private readonly materializer: RowMaterializerService,
    private readonly relationMapper: RelationMapperService,
    private readonly idMapRegistry: IdMapRegistryService,
    private readonly pkService: PrimaryKeyService,
    private readonly projectImporter: ProjectImportService,
    private readonly testEventDupService: TestEventDuplicateService,
    private readonly entityPersistence: EntityPersistenceService
  ) {}

  async prefetchExistingIdsIfNeeded(
    repo: Repository<ObjectLiteral>,
    _name: string,
    primaryIsSingle: boolean,
    primaryKeyProp?: string
  ): Promise<Set<unknown> | null> {
    if (!primaryIsSingle || !primaryKeyProp) return null;
    try {
      const selectField = primaryKeyProp;
      const existing = await repo.find({ select: [selectField] } as Record<
        string,
        unknown
      >);
      return new Set(
        (existing as Array<Record<string, unknown>>).map((e) => e[selectField])
      );
    } catch {
      return new Set();
    }
  }

  // Project importing now delegated to ProjectImportService

  mapRelationsForRow(
    materialized: Record<string, unknown>,
    meta: EntityMetadata,
    projectId: unknown,
    idMaps: Record<string, Map<unknown, unknown>>
  ) {
    this.relationMapper.mapRelations(materialized, meta, projectId, idMaps);
  }

  async importEntitiesFor(
    name: string,
    rows: unknown[] | undefined,
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    ctx: {
      exportedProjectId: unknown;
      newProjectId: unknown;
      stats: Record<string, ImportStats>;
      idMaps: Record<string, Map<unknown, unknown>>;
    }
  ): Promise<unknown> {
    if (!rows?.length) return ctx.newProjectId;
    const pkInfo = this.pkService.getPrimaryKeyInfo(meta);
    const existingIds = await this.prefetchExistingIdsIfNeeded(
      repo,
      name,
      pkInfo.primaryIsSingle,
      pkInfo.primaryKeyProp
    );
    const existingCompositeEventMap =
      await this.testEventDupService.prefetchExistingComposite(meta, repo);
    this.initializeEntityContext(name, ctx);
    if (this.isProjectEntity(meta)) {
      return (
        (await this.importProjectEntity(rows, meta, repo, pkInfo, ctx)) ??
        ctx.newProjectId
      );
    }
    await this.processRows(rows as Array<Record<string, unknown>>, {
      meta,
      repo,
      ctx,
      name,
      pkInfo,
      existingIds,
      existingCompositeEventMap
    });
    return ctx.newProjectId;
  }

  // Persistence responsibility moved to EntityPersistenceService

  private async processRow(params: {
    raw: Record<string, unknown>;
    meta: EntityMetadata;
    repo: Repository<ObjectLiteral>;
    ctx: {
      exportedProjectId: unknown;
      newProjectId: unknown;
      stats: Record<string, ImportStats>;
      idMaps: Record<string, Map<unknown, unknown>>;
    };
    name: string;
    primaryIsSingle: boolean;
    primaryKeyProp?: string;
    existingIds: Set<unknown> | null;
    existingCompositeEventMap: Map<string, unknown> | null;
  }) {
    const {
      raw,
      meta,
      repo,
      ctx,
      name,
      primaryIsSingle,
      primaryKeyProp,
      existingIds,
      existingCompositeEventMap
    } = params;
    const materialized = this.materializer.materialize(raw, meta) as Record<
      string,
      unknown
    >;
    if (meta.name !== 'ProjectEntity' && ctx.newProjectId != null) {
      if ('projectId' in materialized) {
        materialized['projectId'] = ctx.newProjectId;
      }
    } else if (meta.name !== 'ProjectEntity' && ctx.newProjectId == null) {
      this.logger.debug(
        `Import order warning: importing ${meta.name} before new ProjectEntity primary key established.`
      );
    }
    if (meta.name === 'TestEventEntity' && primaryIsSingle && primaryKeyProp) {
      delete materialized[primaryKeyProp];
    }
    if (
      this.testEventDupService.handleDuplicate(
        meta,
        raw,
        materialized,
        existingCompositeEventMap,
        { primaryIsSingle, primaryKeyProp },
        ctx.stats[name]
      )
    ) {
      if (process.env.IMPORT_DEBUG) {
        this.logger.debug(
          `[IMPORT_DEBUG] Duplicate detected for ${meta.name}, composite key skip.`
        );
      }
      return;
    }
    this.mapRelationsForRow(
      materialized,
      meta,
      ctx.newProjectId ?? ctx.exportedProjectId,
      ctx.idMaps
    );

    if (primaryIsSingle && existingIds && primaryKeyProp) {
      const pkVal = materialized[primaryKeyProp];
      if (pkVal != null && existingIds.has(pkVal)) {
        // Certain entities are 1:1 per parent and should be upserted, not skipped, even if their old PK collides.
        const upsertEligible = new Set([
          'ApplicationSettingEntity',
          'AuthenticationSettingEntity',
          'BrowserSettingEntity',
          'RecordingEntity',
          'SpecEntity',
          'ItemDefEntity'
        ]);
        if (!upsertEligible.has(meta.name)) {
          const oldPk = raw[primaryKeyProp];
          if (oldPk != null) this.idMapRegistry.ensure(name).set(oldPk, pkVal);
          ctx.stats[name].skipped++;
          if (process.env.IMPORT_DEBUG) {
            this.logger.debug(
              `[IMPORT_DEBUG] Early skip due to existingId collision for ${meta.name} pkVal=${String(pkVal)}`
            );
          }
          return;
        }
        if (process.env.IMPORT_DEBUG) {
          this.logger.debug(
            `[IMPORT_DEBUG] Collision on pk for upsert-eligible ${meta.name} pkVal=${String(pkVal)} allowing through to persistence.`
          );
        }
        // For upsert-eligible entities, allow persistence layer to perform update path.
      }
    }

    await this.entityPersistence.persistEntityAndRegister(
      meta,
      repo,
      materialized,
      { primaryIsSingle, primaryKeyProp },
      { existingIds, stats: ctx.stats[name] },
      raw
    );
  }

  private initializeEntityContext(
    name: string,
    ctx: {
      stats: Record<string, ImportStats>;
      idMaps: Record<string, Map<unknown, unknown>>;
    }
  ) {
    ctx.stats[name] = { inserted: 0, skipped: 0 };
    ctx.idMaps[name] = new Map();
  }

  private isProjectEntity(meta: EntityMetadata): boolean {
    return meta.name === 'ProjectEntity';
  }

  private async importProjectEntity(
    rows: unknown[],
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string },
    ctx: {
      stats: Record<string, ImportStats>;
      idMaps: Record<string, Map<unknown, unknown>>;
      newProjectId: unknown;
    }
  ): Promise<unknown> {
    return await this.projectImporter.importProjectRows(
      rows,
      meta,
      repo,
      pkInfo,
      ctx.stats[meta.name],
      ctx.idMaps
    );
  }

  private async processRows(
    rows: Array<Record<string, unknown>>,
    args: {
      meta: EntityMetadata;
      repo: Repository<ObjectLiteral>;
      ctx: {
        exportedProjectId: unknown;
        newProjectId: unknown;
        stats: Record<string, ImportStats>;
        idMaps: Record<string, Map<unknown, unknown>>;
      };
      name: string;
      pkInfo: { primaryIsSingle: boolean; primaryKeyProp?: string };
      existingIds: Set<unknown> | null;
      existingCompositeEventMap: Map<string, unknown> | null;
    }
  ) {
    const {
      meta,
      repo,
      ctx,
      name,
      pkInfo,
      existingIds,
      existingCompositeEventMap
    } = args;
    for (const raw of rows) {
      await this.processRow({
        raw,
        meta,
        repo,
        ctx,
        name,
        primaryIsSingle: pkInfo.primaryIsSingle,
        primaryKeyProp: pkInfo.primaryKeyProp,
        existingIds,
        existingCompositeEventMap
      });
    }
  }

  /**
   * Optional helper to run a higher-level import routine inside a transaction.
   * Caller supplies a function that receives an EntityManager. If the datasource
   * is undefined or transaction fails, behavior is logged and error rethrown.
   */
  async runInTransaction<T>(
    dataSource: DataSource | undefined,
    fn: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    if (!dataSource) {
      this.logger.debug(
        'runInTransaction called without DataSource – executing non-transactionally.'
      );
      return await fn(undefined as unknown as EntityManager);
    }
    return await dataSource.transaction(async (manager) => fn(manager));
  }
}
