import { describe, it, expect, vi } from 'vitest';
import {
  SinglePerParentUpsertService,
  type UpsertContext
} from './single-per-parent-upsert.service';
import { RelationMapperService } from './relation-mapper.service';
import { IdMapRegistryService } from './id-map-registry.service';

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
    const repo = { findOne: vi.fn(), save: vi.fn() } as never;
    const ok = await svc.tryUpsert(
      { name: 'Other' } as never,
      repo,
      { foo: 1 },
      {
        primaryIsSingle: true,
        primaryKeyProp: 'id',
        existingIds: null,
        stats: { skipped: 0, inserted: 0, total: 0 } as never,
        raw: {}
      } as UpsertContext
    );
    expect(ok).toBe(false);
  });

  it('returns false when no relation id is present', async () => {
    const { registry, relationMapper } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const repo = { findOne: vi.fn(), save: vi.fn() } as never;
    const ok = await svc.tryUpsert({ name: 'SpecEntity' } as never, repo, {}, {
      primaryIsSingle: true,
      primaryKeyProp: 'id',
      existingIds: null,
      stats: { skipped: 0, inserted: 0, total: 0 } as never,
      raw: {}
    } as UpsertContext);
    expect(ok).toBe(false);
    expect(repo.findOne).not.toHaveBeenCalled();
  });

  it('updates an existing row when one exists for the same parent', async () => {
    const { registry, relationMapper, map } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const existing = { id: 'EXISTING', testEvent: { id: 'p' } };
    const repo = {
      findOne: vi.fn().mockResolvedValue(existing),
      save: vi.fn().mockResolvedValue(existing)
    } as never;
    const ctx: UpsertContext = {
      primaryIsSingle: true,
      primaryKeyProp: 'id',
      existingIds: new Set(),
      stats: { skipped: 0, inserted: 0, total: 0 } as never,
      raw: { id: 'OLD', __exportRef: 'ref-1' }
    };
    const ok = await svc.tryUpsert(
      { name: 'SpecEntity' } as never,
      repo,
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
    const repo = {
      findOne: vi.fn().mockResolvedValue(null),
      save: vi.fn()
    } as never;
    const ok = await svc.tryUpsert(
      { name: 'SpecEntity' } as never,
      repo,
      { testEvent: { id: 'p' } },
      {
        primaryIsSingle: false,
        existingIds: null,
        stats: { skipped: 0, inserted: 0, total: 0 } as never,
        raw: {}
      } as UpsertContext
    );
    expect(ok).toBe(false);
  });

  it('returns false when findOne throws', async () => {
    const { registry, relationMapper } = deps();
    const svc = new SinglePerParentUpsertService(relationMapper, registry);
    const repo = {
      findOne: vi.fn().mockRejectedValue(new Error('db')),
      save: vi.fn()
    } as never;
    const ok = await svc.tryUpsert(
      { name: 'SpecEntity' } as never,
      repo,
      { testEvent: { id: 'p' } },
      {
        primaryIsSingle: true,
        primaryKeyProp: 'id',
        existingIds: null,
        stats: { skipped: 0, inserted: 0, total: 0 } as never,
        raw: {}
      } as UpsertContext
    );
    expect(ok).toBe(false);
  });
});
