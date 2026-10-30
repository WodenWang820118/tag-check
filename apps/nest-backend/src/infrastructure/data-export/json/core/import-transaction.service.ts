import { Injectable } from '@nestjs/common';
import { DataSource, EntityMetadata } from 'typeorm';
import { runExclusively } from '../../../../core/database/sqlite-transaction-gate';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';
import { TopologicalSorterService } from './topological-sorter.service';
import { PointerRepairService } from './pointer-repair.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { EntityImportService } from './entity-import.service';
import { RelationMapperService } from './relation-mapper.service';
import {
  ImportRuntimeContext,
  ImportStats
} from '../../interfaces/import-types';

/**
 * Imports a whole fixture envelope in one database transaction: either every
 * row is written or, when any step throws, none is. Rows a step skips (and
 * counts in the stats) do not abort the import.
 */
@Injectable()
export class ImportTransactionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly sorter: TopologicalSorterService,
    private readonly pointerRepair: PointerRepairService,
    private readonly idMapRegistry: IdMapRegistryService,
    private readonly entityImporter: EntityImportService,
    private readonly relationMapper: RelationMapperService
  ) {}

  /**
   * Imports the envelope's entities parents first, then sets the pointers
   * that target rows imported later.
   *
   * @returns Inserted and skipped row counts per entity.
   * @throws Whatever a step throws, after rolling the transaction back.
   */
  async runWithinTransaction(env: FixtureEnvelopeV1): Promise<{
    stats: Record<string, ImportStats>;
  }> {
    // The import starts and commits its own transaction on SQLite's shared
    // query runner, so it goes through the gate like manager.transaction.
    return runExclusively(this.dataSource, () => this.importEntities(env));
  }

  private async importEntities(env: FixtureEnvelopeV1): Promise<{
    stats: Record<string, ImportStats>;
  }> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const metasByName = new Map<string, EntityMetadata>(
        this.dataSource.entityMetadatas.map((m) => [m.name, m])
      );
      const insertionOrder = this.sorter.order(env, metasByName);
      // The ID and alternate-key maps are singletons: start from empty ones
      // so that keys of an earlier (possibly rolled back) import cannot
      // resolve references of this one.
      this.idMapRegistry.clear();
      this.relationMapper.clear();

      const ctx: ImportRuntimeContext = {
        exportedProjectId: this.determineExportedProjectId(env),
        newProjectId: undefined,
        stats: {},
        idMaps: this.idMapRegistry.getAll(),
        pendingEntities: new Set(
          insertionOrder.filter((name) => env.entities[name]?.length)
        ),
        deferredPointers: []
      };

      // Sequential on purpose: each entity needs the new IDs of the ones
      // before it, and every write goes through the same transaction.
      for (const name of insertionOrder) {
        const meta = metasByName.get(name);
        if (!meta) continue;
        const repo = queryRunner.manager.getRepository(meta.name);
        const maybeNewProjectId = await this.entityImporter.importEntitiesFor(
          name,
          env.entities[name],
          meta,
          repo,
          ctx
        );
        ctx.newProjectId = maybeNewProjectId ?? ctx.newProjectId;
        ctx.pendingEntities?.delete(name);
      }

      await this.pointerRepair.repairPointers(
        queryRunner,
        ctx.deferredPointers ?? []
      );
      await queryRunner.commitTransaction();
      return { stats: ctx.stats };
    } catch (e) {
      if (queryRunner.isTransactionActive)
        await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /** The exported primary key of the envelope's first project row. */
  private determineExportedProjectId(env: FixtureEnvelopeV1): unknown {
    const projectRows = env.entities['ProjectEntity'];
    if (!Array.isArray(projectRows) || projectRows.length === 0) {
      return undefined;
    }
    return (projectRows[0] as Record<string, unknown>)['id'];
  }
}
