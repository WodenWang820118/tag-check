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
import { ImportStats } from '../../interfaces/import-types';
import { PrimaryKeyService } from './primary-key.service';
import { ProjectImportService } from './project-import.service';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { EntityPersistenceService } from './entity-persistence.service';
import { ImportRowProcessorService } from './import-row-processor.service';

@Injectable()
export class EntityImportService {
  private readonly logger = new Logger(EntityImportService.name);
  constructor(
    private readonly materializer: RowMaterializerService,
    private readonly relationMapper: RelationMapperService,
    private readonly pkService: PrimaryKeyService,
    private readonly projectImporter: ProjectImportService,
    private readonly testEventDupService: TestEventDuplicateService,
    private readonly entityPersistence: EntityPersistenceService,
    private readonly rowProcessor: ImportRowProcessorService
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
    // Delegate pre-processing (assign project id, duplicate detection, PK collision handling)
    const shouldSkip = await this.rowProcessor.preProcessRow({
      raw,
      materialized,
      meta,
      name,
      pkInfo: { primaryIsSingle, primaryKeyProp },
      existingIds,
      existingCompositeEventMap,
      ctx
    });
    if (shouldSkip) return;

    this.mapRelationsForRow(
      materialized,
      meta,
      ctx.newProjectId ?? ctx.exportedProjectId,
      ctx.idMaps
    );
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
