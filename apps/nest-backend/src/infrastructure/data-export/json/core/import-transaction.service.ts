import { Injectable, Logger } from '@nestjs/common';
import { DataSource, EntityMetadata } from 'typeorm';
import { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';
import { TopologicalSorterService } from './topological-sorter.service';
import { PointerRepairService } from './pointer-repair.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { EntityImportService } from './entity-import.service';
import {
  ImportRuntimeContext,
  ImportStats
} from '../../interfaces/import-types';

@Injectable()
export class ImportTransactionService {
  private readonly logger = new Logger(ImportTransactionService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly sorter: TopologicalSorterService,
    private readonly pointerRepair: PointerRepairService,
    private readonly idMapRegistry: IdMapRegistryService,
    private readonly entityImporter: EntityImportService
  ) {}

  async runWithinTransaction(env: FixtureEnvelopeV1): Promise<{
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
      // Debug: log insertion order during tests
      if (process.env.NODE_ENV !== 'prod') {
        console.log('Import insertion order:', insertionOrder); // debug
      }
      const stats: Record<string, ImportStats> = {};
      this.idMapRegistry.clear();
      const idMaps = this.idMapRegistry.getAll();

      const ctx: ImportRuntimeContext = {
        exportedProjectId: this.determineExportedProjectId(env),
        newProjectId: undefined,
        stats,
        idMaps
      };

      for (const name of insertionOrder) {
        const meta = metasByName.get(name);
        if (!meta) continue;
        const rows = env.entities[name];
        const repo = queryRunner.manager.getRepository(meta.name);
        const maybeNewProjectId = await this.entityImporter.importEntitiesFor(
          name,
          rows,
          meta,
          repo,
          ctx
        );
        ctx.newProjectId = maybeNewProjectId ?? ctx.newProjectId;
      }

      await this.pointerRepair.repairPointers(
        queryRunner,
        metasByName,
        insertionOrder,
        ctx.idMaps
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

  private determineExportedProjectId(env: FixtureEnvelopeV1): unknown {
    let exportedProjectId: unknown = undefined;
    const projectRows = env.entities['ProjectEntity'];
    if (Array.isArray(projectRows) && projectRows.length > 0) {
      const candidate = projectRows[0] as Record<string, unknown>;
      if ('id' in candidate) exportedProjectId = candidate['id'];
    }
    return exportedProjectId;
  }
}
