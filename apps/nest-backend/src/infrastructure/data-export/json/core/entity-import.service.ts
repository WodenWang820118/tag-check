import { Injectable, Optional } from '@nestjs/common';
import { EntityMetadata, Repository, ObjectLiteral } from 'typeorm';
import { RowMaterializerService } from './row-materializer.service';
import { RelationMapperService } from './relation-mapper.service';
import { ImportRuntimeContext } from '../../interfaces/import-types';
import { PrimaryKeyService } from './primary-key.service';
import { ProjectImportService } from './project-import.service';
import { TestEventDuplicateService } from './test-event-duplicate.service';
import { EntityPersistenceService } from './entity-persistence.service';
import { ImportRowProcessorService } from './import-row-processor.service';
import { PointerRepairService } from './pointer-repair.service';

type PkInfo = { primaryIsSingle: boolean; primaryKeyProp?: string };

/** What every row of one entity's import shares. */
type EntityImportArgs = {
  meta: EntityMetadata;
  repo: Repository<ObjectLiteral>;
  ctx: ImportRuntimeContext;
  name: string;
  pkInfo: PkInfo;
  existingIds: Set<unknown> | null;
  existingCompositeEventMap: Map<string, unknown> | null;
};

/**
 * Imports the rows of one entity: project rows through ProjectImportService,
 * every other row through pre-processing, relation remapping and
 * persistence. Rows that fail are counted as skipped, not thrown.
 */
@Injectable()
export class EntityImportService {
  constructor(
    private readonly materializer: RowMaterializerService,
    private readonly relationMapper: RelationMapperService,
    private readonly pkService: PrimaryKeyService,
    private readonly projectImporter: ProjectImportService,
    private readonly testEventDupService: TestEventDuplicateService,
    private readonly entityPersistence: EntityPersistenceService,
    private readonly rowProcessor: ImportRowProcessorService,
    @Optional() private readonly pointerRepair?: PointerRepairService
  ) {}

  /**
   * The primary keys already in the table, to detect collisions with the
   * exported keys. Null for a composite key; empty when the read fails.
   */
  async prefetchExistingIdsIfNeeded(
    repo: Repository<ObjectLiteral>,
    primaryIsSingle: boolean,
    primaryKeyProp?: string
  ): Promise<Set<unknown> | null> {
    if (!primaryIsSingle || !primaryKeyProp) return null;
    try {
      const existing = (await repo.find({
        select: [primaryKeyProp]
      })) as Array<Record<string, unknown>>;
      return new Set(existing.map((e) => e[primaryKeyProp]));
    } catch {
      return new Set();
    }
  }

  /**
   * Imports `rows` of the entity `name` and resets its stats and ID map in
   * `ctx`.
   *
   * @returns The new project ID once the project rows are imported, else
   * `ctx.newProjectId` unchanged.
   */
  async importEntitiesFor(
    name: string,
    rows: unknown[] | undefined,
    meta: EntityMetadata,
    repo: Repository<ObjectLiteral>,
    ctx: ImportRuntimeContext
  ): Promise<unknown> {
    if (!rows?.length) return ctx.newProjectId;
    const pkInfo = this.pkService.getPrimaryKeyInfo(meta);
    const existingIds = await this.prefetchExistingIdsIfNeeded(
      repo,
      pkInfo.primaryIsSingle,
      pkInfo.primaryKeyProp
    );
    const existingCompositeEventMap =
      await this.testEventDupService.prefetchExistingComposite(meta, repo);
    ctx.stats[name] = { inserted: 0, skipped: 0 };
    ctx.idMaps[name] = new Map();
    if (meta.name === 'ProjectEntity') {
      return (
        (await this.projectImporter.importProjectRows(
          rows,
          meta,
          repo,
          pkInfo,
          ctx.stats[name],
          ctx.idMaps
        )) ?? ctx.newProjectId
      );
    }
    const args: EntityImportArgs = {
      meta,
      repo,
      ctx,
      name,
      pkInfo,
      existingIds,
      existingCompositeEventMap
    };
    // Sequential on purpose: a row may need the new ID of an earlier row,
    // and every write goes through the import's single transaction.
    for (const raw of rows as Array<Record<string, unknown>>) {
      await this.processRow(raw, args);
    }
    return ctx.newProjectId;
  }

  private async processRow(
    raw: Record<string, unknown>,
    args: EntityImportArgs
  ): Promise<void> {
    const {
      meta,
      repo,
      ctx,
      name,
      pkInfo,
      existingIds,
      existingCompositeEventMap
    } = args;
    const materialized = this.materializer.materialize(raw, meta);
    const shouldSkip = this.rowProcessor.preProcessRow({
      raw,
      materialized,
      meta,
      name,
      pkInfo,
      existingIds,
      existingCompositeEventMap,
      ctx
    });
    if (shouldSkip) return;

    // Pointers to rows imported later are set once those rows exist.
    this.pointerRepair?.deferForwardPointers(
      materialized,
      raw,
      meta,
      ctx,
      pkInfo.primaryKeyProp
    );
    this.relationMapper.mapRelations(
      materialized,
      meta,
      ctx.newProjectId ?? ctx.exportedProjectId,
      ctx.idMaps
    );
    await this.entityPersistence.persistEntityAndRegister(
      meta,
      repo,
      materialized,
      pkInfo,
      { existingIds, stats: ctx.stats[name] },
      raw
    );
  }
}
