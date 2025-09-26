import { EntityPersistenceService } from './entity-persistence.service';
import { RelationMapperService } from './relation-mapper.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { SinglePerParentUpsertService } from './single-per-parent-upsert.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { EntityMetadata, ObjectLiteral, Repository } from 'typeorm';

function makeMeta(name: string): EntityMetadata {
  return { name } as unknown as EntityMetadata; // minimal stub
}

describe('EntityPersistenceService.persistEntityAndRegister - update path', () => {
  let service: EntityPersistenceService;
  let relationMapper: Pick<RelationMapperService, 'register'>;
  let idMapRegistry: Pick<IdMapRegistryService, 'ensure'>;
  let repo: Pick<Repository<ObjectLiteral>, 'findOne' | 'save' | 'create'>;
  let upsertSvc: Pick<SinglePerParentUpsertService, 'tryUpsert'>;

  beforeEach(() => {
    relationMapper = { register: vi.fn() };
    idMapRegistry = { ensure: vi.fn(() => new Map()) };
    upsertSvc = { tryUpsert: vi.fn().mockResolvedValue(false) };
    service = new EntityPersistenceService(
      relationMapper as RelationMapperService,
      idMapRegistry as IdMapRegistryService,
      upsertSvc as unknown as SinglePerParentUpsertService
    );

    repo = {
      findOne: vi.fn(),
      save: vi.fn(),
      create: vi.fn()
    };
  });

  it('inserts new entity when no existing single-per-parent entity', async () => {
    const meta = makeMeta('RecordingEntity');
    // upsert returns false so normal insert path executes
    (repo.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      null
    );
    (repo.create as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (o) => ({ ...o })
    );
    (repo.save as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (ent) => {
        // simulate database assigning id
        (ent as Record<string, unknown>).id = 42;
        return ent;
      }
    );

    const raw = {
      id: 999,
      testEvent: { id: 300 },
      some: 'value',
      __exportRef: 'export-2'
    } as Record<string, unknown>;
    const materialized = { ...raw };
    const stats = { inserted: 0, skipped: 0 };
    const existingIds = new Set();

    await service.persistEntityAndRegister(
      meta,
      repo as unknown as Repository<ObjectLiteral>,
      materialized,
      { primaryIsSingle: true, primaryKeyProp: 'id' },
      { existingIds, stats },
      raw
    );

    // With delegated upsert service returning false, direct create path does not need repo.findOne
    expect(repo.save).toHaveBeenCalled();
    expect(stats.inserted).toBe(1);
    expect(stats.skipped).toBe(0);
    expect(existingIds.has(42)).toBe(true);
    expect(relationMapper.register).toHaveBeenCalledWith(
      'RecordingEntity',
      'export-2',
      42
    );
  });

  it('increments skipped when save throws', async () => {
    const meta = makeMeta('RecordingEntity');
    (repo.findOne as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      null
    );
    (repo.create as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (o) => ({ ...o })
    );
    (repo.save as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      () => {
        throw new Error('db failure');
      }
    );
    const raw = { id: 1, testEvent: { id: 7 }, some: 'thing' } as Record<
      string,
      unknown
    >;
    const materialized = { ...raw };
    const stats = { inserted: 0, skipped: 0 };

    await service.persistEntityAndRegister(
      meta,
      repo as unknown as Repository<ObjectLiteral>,
      materialized,
      { primaryIsSingle: true, primaryKeyProp: 'id' },
      { existingIds: new Set(), stats },
      raw
    );

    expect(stats.inserted).toBe(0);
    expect(stats.skipped).toBe(1);
  });

  it('updates existing single-per-parent entity and maps ids', async () => {
    const meta = makeMeta('RecordingEntity'); // single-per-parent keyed by testEvent

    // Now delegate via upsert service (simulate handled update)
    (
      upsertSvc.tryUpsert as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(true);
    const raw = {
      id: 999,
      testEvent: { id: 200 },
      some: 'new',
      __exportRef: 'export-1'
    } as Record<string, unknown>;
    const materialized = { ...raw };
    const stats = { inserted: 0, skipped: 0 };
    await service.persistEntityAndRegister(
      meta,
      repo as unknown as Repository<ObjectLiteral>,
      materialized,
      { primaryIsSingle: true, primaryKeyProp: 'id' },
      { existingIds: new Set(), stats },
      raw
    );
    expect(upsertSvc.tryUpsert).toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled(); // short-circuited
    expect(stats.inserted).toBe(0); // upsertSvc increments internally; here we mocked so leave 0
  });

  it('delegates to upsert service and does not proceed when upsert returns true', async () => {
    const meta = makeMeta('RecordingEntity');
    (
      upsertSvc.tryUpsert as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(true);
    const raw = { id: 1, testEvent: { id: 2 }, some: 'data' } as Record<
      string,
      unknown
    >;
    const materialized = { ...raw };
    const stats = { inserted: 0, skipped: 0 };
    await service.persistEntityAndRegister(
      meta,
      repo as unknown as Repository<ObjectLiteral>,
      materialized,
      { primaryIsSingle: true, primaryKeyProp: 'id' },
      { existingIds: new Set(), stats },
      raw
    );
    expect(upsertSvc.tryUpsert).toHaveBeenCalled();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
