import { describe, it, expect, vi } from 'vitest';
import { ImportTransactionService } from './import-transaction.service';
import { TopologicalSorterService } from './topological-sorter.service';
import { PointerRepairService } from './pointer-repair.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { EntityImportService } from './entity-import.service';
import { RelationMapperService } from './relation-mapper.service';
import type { DataSource } from 'typeorm';
import type { FixtureEnvelopeV1 } from '../../interfaces/fixture-types';

function makeQueryRunner() {
  return {
    connect: vi.fn().mockResolvedValue(undefined),
    startTransaction: vi.fn().mockResolvedValue(undefined),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    rollbackTransaction: vi.fn().mockResolvedValue(undefined),
    release: vi.fn().mockResolvedValue(undefined),
    isTransactionActive: true,
    manager: { getRepository: vi.fn(() => ({})) }
  };
}

describe('ImportTransactionService', () => {
  function build(opts?: { importThrows?: Error }) {
    const qr = makeQueryRunner();
    const dataSource = {
      createQueryRunner: () => qr,
      entityMetadatas: [{ name: 'ProjectEntity' } as never]
    } as unknown as DataSource;
    const sorter = {
      order: vi.fn(() => ['ProjectEntity'])
    } as unknown as TopologicalSorterService;
    const pointerRepair = {
      repairPointers: vi.fn().mockResolvedValue(undefined)
    } as unknown as PointerRepairService;
    const idMapRegistry = {
      clear: vi.fn(),
      getAll: vi.fn(() => ({}))
    } as unknown as IdMapRegistryService;
    const entityImporter = {
      importEntitiesFor: vi.fn(async () => {
        if (opts?.importThrows) throw opts.importThrows;
        return 'new-id';
      })
    } as unknown as EntityImportService;
    const relationMapper = {
      clear: vi.fn()
    } as unknown as RelationMapperService;

    return {
      svc: new ImportTransactionService(
        dataSource,
        sorter,
        pointerRepair,
        idMapRegistry,
        entityImporter,
        relationMapper
      ),
      qr,
      pointerRepair,
      entityImporter,
      idMapRegistry,
      relationMapper
    };
  }

  const env: FixtureEnvelopeV1 = {
    entities: { ProjectEntity: [{ id: 'old-proj' }] }
  } as unknown as FixtureEnvelopeV1;

  it('runs imports inside a transaction and commits on success', async () => {
    const { svc, qr, pointerRepair, entityImporter } = build();
    const out = await svc.runWithinTransaction(env);
    expect(qr.startTransaction).toHaveBeenCalled();
    expect(entityImporter.importEntitiesFor).toHaveBeenCalled();
    expect(pointerRepair.repairPointers).toHaveBeenCalled();
    expect(qr.commitTransaction).toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalled();
    expect(out.stats).toBeDefined();
  });

  it("starts from empty id and alternate-key maps, so an earlier import's keys cannot resolve this one's references", async () => {
    const { svc, idMapRegistry, relationMapper } = build();
    await svc.runWithinTransaction(env);
    expect(idMapRegistry.clear).toHaveBeenCalled();
    expect(relationMapper.clear).toHaveBeenCalled();
  });

  it('repairs the pointers recorded while the rows were imported', async () => {
    const { svc, pointerRepair, entityImporter } = build();
    vi.mocked(entityImporter.importEntitiesFor).mockImplementationOnce(
      async (_name, _rows, _meta, _repo, ctx) => {
        ctx.deferredPointers?.push({
          entityName: 'TestEventEntity',
          exportedRowId: 1,
          relationProp: 'latestTestEventDetail',
          targetEntityName: 'TestEventDetailEntity',
          exportedTargetId: 2
        });
        return 'new-id';
      }
    );
    await svc.runWithinTransaction(env);
    expect(pointerRepair.repairPointers).toHaveBeenCalledWith(
      expect.anything(),
      [expect.objectContaining({ exportedTargetId: 2 })]
    );
  });

  it('rolls back the transaction on error and rethrows', async () => {
    const err = new Error('bad');
    const { svc, qr } = build({ importThrows: err });
    await expect(svc.runWithinTransaction(env)).rejects.toBe(err);
    expect(qr.rollbackTransaction).toHaveBeenCalled();
    expect(qr.release).toHaveBeenCalled();
    expect(qr.commitTransaction).not.toHaveBeenCalled();
  });
});
