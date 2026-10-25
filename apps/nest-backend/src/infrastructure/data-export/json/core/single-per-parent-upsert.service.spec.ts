import { describe, it, expect, vi } from 'vitest';
import {
  SinglePerParentUpsertService,
  type UpsertContext
} from './single-per-parent-upsert.service';
import { RelationMapperService } from './relation-mapper.service';
import { IdMapRegistryService } from './id-map-registry.service';
import {
  asRepository,
  entityMeta,
  importRepositoryMock
} from './import-repository.spec-helpers';

function deps() {
  const map = new Map<unknown, unknown>();
  const registry = {
    ensure: vi.fn(() => map)
  } as unknown as IdMapRegistryService;
  const relationMapper = {
    register: vi.fn()
  } as unknown as RelationMapperService;
  return { registry, relationMapper, map };
}

function upsertContext(overrides: Partial<UpsertContext> = {}): UpsertContext {
  return {
    primaryIsSingle: true,
    primaryKeyProp: 'id',
    existingIds: null,
    stats: { skipped: 0, inserted: 0 },
    raw: {},
    ...overrides
  };
}

describe('SinglePerParentUpsertService', () => {
  it('returns a relation prop for known single-per-parent entities', () => {
    const { registry, relationMapper } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    expect(svc.getRelationProp('SpecEntity')).toBe('testEvent');
    expect(svc.getRelationProp('UnknownEntity')).toBeUndefined();
  });

  it('returns false when the entity is not single-per-parent eligible', async () => {
    const { registry, relationMapper } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const repo = importRepositoryMock();
    const ok = await svc.tryUpsert(
      entityMeta('Other'),
      asRepository(repo),
      { foo: 1 },
      upsertContext()
    );
    expect(ok).toBe(false);
  });

  it('returns false when no relation id is present', async () => {
    const { registry, relationMapper } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const repo = importRepositoryMock();
    const ok = await svc.tryUpsert(
      entityMeta('SpecEntity'),
      asRepository(repo),
      {},
      upsertContext()
    );
    expect(ok).toBe(false);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('updates an existing row when one exists for the same parent', async () => {
    const { registry, relationMapper, map } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const existing = { id: 'EXISTING', testEvent: { id: 'p' } };
    const repo = importRepositoryMock();
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockResolvedValue(existing);
    const ctx = upsertContext({
      existingIds: new Set(),
      raw: { id: 'OLD', __exportRef: 'ref-1' }
    });
    const ok = await svc.tryUpsert(
      entityMeta('SpecEntity'),
      asRepository(repo),
      { id: 'OLD', testEvent: { id: 'p' }, name: 'updated' },
      ctx
    );
    expect(ok).toBe(true);
    expect(map.get('OLD')).toBe('EXISTING');
    expect(ctx.stats.inserted).toBe(1);
    expect(relationMapper.register).toHaveBeenCalledWith(
      'SpecEntity',
      'ref-1',
      'EXISTING'
    );
  });

  it('returns false when no existing row matches', async () => {
    const { registry, relationMapper } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const repo = importRepositoryMock();
    repo.findOne.mockResolvedValue(null);
    const ok = await svc.tryUpsert(
      entityMeta('SpecEntity'),
      asRepository(repo),
      { testEvent: { id: 'p' } },
      upsertContext({ primaryIsSingle: false, primaryKeyProp: undefined })
    );
    expect(ok).toBe(false);
  });

  it('returns false when findOne throws', async () => {
    const { registry, relationMapper } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const repo = importRepositoryMock();
    repo.findOne.mockRejectedValue(new Error('db'));
    const ok = await svc.tryUpsert(
      entityMeta('SpecEntity'),
      asRepository(repo),
      { testEvent: { id: 'p' } },
      upsertContext()
    );
    expect(ok).toBe(false);
  });
});
