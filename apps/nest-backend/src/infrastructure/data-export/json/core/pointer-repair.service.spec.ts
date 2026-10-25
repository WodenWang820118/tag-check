import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EntityMetadata, QueryRunner } from 'typeorm';
import { PointerRepairService } from './pointer-repair.service';
import { IdMapRegistryService } from './id-map-registry.service';
import type { DeferredPointer } from '../../interfaces/import-types';

/** A test with a latest-result pointer, as TypeORM describes it. */
const testMeta = {
  name: 'TestEventEntity',
  relations: [
    {
      isManyToOne: true,
      propertyName: 'project',
      joinColumns: [{ databaseName: 'project_id' }],
      inverseEntityMetadata: { name: 'ProjectEntity' }
    },
    {
      isOneToOneOwner: true,
      propertyName: 'latestTestEventDetail',
      joinColumns: [{ databaseName: 'latest_test_event_detail_id' }],
      inverseEntityMetadata: { name: 'TestEventDetailEntity' }
    },
    {
      isOneToOneOwner: false,
      propertyName: 'spec',
      joinColumns: [],
      inverseEntityMetadata: { name: 'SpecEntity' }
    }
  ],
  columns: [
    {
      propertyName: 'latestTestEventDetailId',
      databaseName: 'latest_test_event_detail_id'
    },
    { propertyName: 'eventId', databaseName: 'event_id' }
  ]
} as unknown as EntityMetadata;

describe('PointerRepairService', () => {
  let registry: IdMapRegistryService;
  let svc: PointerRepairService;

  beforeEach(() => {
    registry = new IdMapRegistryService();
    svc = new PointerRepairService(registry);
  });

  describe('deferForwardPointers', () => {
    it('removes a pointer to a pending entity and records it', () => {
      const raw = {
        id: 4,
        project: 1,
        latestTestEventDetail: 9,
        latestTestEventDetailId: 9,
        eventId: 'e'
      };
      const materialized: Record<string, unknown> = { ...raw };
      const ctx = {
        pendingEntities: new Set(['TestEventEntity', 'TestEventDetailEntity']),
        deferredPointers: [] as DeferredPointer[]
      };

      svc.deferForwardPointers(materialized, raw, testMeta, ctx, 'id');

      expect(materialized).toEqual({ id: 4, project: 1, eventId: 'e' });
      expect(ctx.deferredPointers).toEqual([
        {
          entityName: 'TestEventEntity',
          exportedRowId: 4,
          relationProp: 'latestTestEventDetail',
          targetEntityName: 'TestEventDetailEntity',
          exportedTargetId: 9
        }
      ]);
    });

    it('keeps pointers to entities already imported', () => {
      const raw = { id: 4, project: 1, latestTestEventDetail: { id: 9 } };
      const materialized: Record<string, unknown> = { ...raw };
      const ctx = {
        pendingEntities: new Set(['TestEventEntity']),
        deferredPointers: [] as DeferredPointer[]
      };

      svc.deferForwardPointers(materialized, raw, testMeta, ctx, 'id');

      expect(materialized).toEqual(raw);
      expect(ctx.deferredPointers).toEqual([]);
    });

    it('does nothing without pending entities in the context', () => {
      const raw = { id: 4, latestTestEventDetail: 9 };
      const materialized: Record<string, unknown> = { ...raw };

      svc.deferForwardPointers(materialized, raw, testMeta, {}, 'id');

      expect(materialized).toEqual(raw);
    });
  });

  describe('repairPointers', () => {
    const pointer: DeferredPointer = {
      entityName: 'TestEventEntity',
      exportedRowId: 4,
      relationProp: 'latestTestEventDetail',
      targetEntityName: 'TestEventDetailEntity',
      exportedTargetId: 9
    };

    function queryRunnerWith(update: ReturnType<typeof vi.fn>) {
      return {
        manager: { getRepository: vi.fn(() => ({ update })) }
      } as unknown as QueryRunner;
    }

    it('points an imported row at the new id of its target', async () => {
      registry.set('TestEventEntity', 4, 40);
      registry.markCreated('TestEventEntity', 40);
      registry.set('TestEventDetailEntity', 9, 90);
      const update = vi.fn().mockResolvedValue(undefined);

      await svc.repairPointers(queryRunnerWith(update), [pointer]);

      expect(update).toHaveBeenCalledWith(40, {
        latestTestEventDetail: { id: 90 }
      });
    });

    it('leaves a row the import merged into an existing one', async () => {
      registry.set('TestEventEntity', 4, 40);
      registry.set('TestEventDetailEntity', 9, 90);
      const update = vi.fn();

      await svc.repairPointers(queryRunnerWith(update), [pointer]);

      expect(update).not.toHaveBeenCalled();
    });

    it('leaves the pointer empty when its target was not imported', async () => {
      registry.set('TestEventEntity', 4, 40);
      registry.markCreated('TestEventEntity', 40);
      const update = vi.fn();

      await svc.repairPointers(queryRunnerWith(update), [pointer]);

      expect(update).not.toHaveBeenCalled();
    });

    it('rethrows a failed update so the import rolls back', async () => {
      registry.set('TestEventEntity', 4, 40);
      registry.markCreated('TestEventEntity', 40);
      registry.set('TestEventDetailEntity', 9, 90);
      const update = vi.fn().mockRejectedValue(new Error('db down'));

      await expect(
        svc.repairPointers(queryRunnerWith(update), [pointer])
      ).rejects.toThrow('db down');
    });
  });
});
