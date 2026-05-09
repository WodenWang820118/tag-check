import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectImportService } from './project-import.service';
import { RowMaterializerService } from './row-materializer.service';
import { ProjectSlugService } from './project-slug.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { RelationMapperService } from './relation-mapper.service';

function deps() {
  const materializer = {
    materialize: vi.fn((raw: Record<string, unknown>) => ({ ...raw }))
  } as unknown as RowMaterializerService;
  const slugService = {
    ensureUnique: vi.fn(async (_r, slug: string) => slug)
  } as unknown as ProjectSlugService;
  const map = new Map<unknown, unknown>();
  const registry = {
    ensure: vi.fn(() => map),
    set: vi.fn((_n, k, v) => map.set(k, v))
  } as unknown as IdMapRegistryService;
  const relationMapper = {
    register: vi.fn()
  } as unknown as RelationMapperService;
  return { materializer, slugService, registry, relationMapper, map };
}

const meta = { name: 'ProjectEntity' } as never;
const pkInfo = { primaryIsSingle: true, primaryKeyProp: 'id' };

describe('ProjectImportService', () => {
  let stats: { skipped: number; inserted: number; total: number };
  beforeEach(() => {
    stats = { skipped: 0, inserted: 0, total: 0 };
  });

  it('skips rows that have no projectSlug', async () => {
    const d = deps();
    const svc = new ProjectImportService(
      d.materializer,
      d.slugService,
      d.registry,
      d.relationMapper
    );
    const repo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() } as never;
    const out = await svc.importProjectRows(
      [{ id: 'a' }],
      meta,
      repo,
      pkInfo,
      stats as never,
      {}
    );
    expect(out).toBeUndefined();
    expect(stats.skipped).toBe(1);
  });

  it('updates an existing project (matched by slug) and registers slug + exportRef', async () => {
    const d = deps();
    const svc = new ProjectImportService(
      d.materializer,
      d.slugService,
      d.registry,
      d.relationMapper
    );
    const existing = { id: 'EXISTING', projectSlug: 's', name: 'old' };
    const repo = {
      findOne: vi.fn().mockResolvedValue(existing),
      save: vi.fn().mockResolvedValue(existing),
      create: vi.fn()
    } as never;
    const out = await svc.importProjectRows(
      [{ id: 'OLD', projectSlug: 's', name: 'new', __exportRef: 'ref-1' }],
      meta,
      repo,
      pkInfo,
      stats as never,
      {}
    );
    expect(out).toBe('EXISTING');
    expect(repo.save).toHaveBeenCalled();
    expect(d.relationMapper.register).toHaveBeenCalledWith(
      'ProjectEntity',
      's',
      'EXISTING'
    );
    expect(d.relationMapper.register).toHaveBeenCalledWith(
      'ProjectEntity',
      'ref-1',
      'EXISTING'
    );
    expect(stats.inserted).toBe(1);
  });

  it('creates a new project when none exists, ensuring slug uniqueness', async () => {
    const d = deps();
    const svc = new ProjectImportService(
      d.materializer,
      d.slugService,
      d.registry,
      d.relationMapper
    );
    const created = { id: 'NEW', projectSlug: 's-1' };
    const repo = {
      findOne: vi.fn().mockResolvedValue(null),
      create: vi.fn(() => created),
      save: vi.fn().mockResolvedValue(created)
    } as never;
    (d.slugService.ensureUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      's-1'
    );
    const out = await svc.importProjectRows(
      [{ id: 'OLD', projectSlug: 's' }],
      meta,
      repo,
      pkInfo,
      stats as never,
      {}
    );
    expect(out).toBe('NEW');
    expect(d.slugService.ensureUnique).toHaveBeenCalledWith(repo, 's');
    expect(repo.create).toHaveBeenCalled();
    expect(d.relationMapper.register).toHaveBeenCalledWith(
      'ProjectEntity',
      's-1',
      'NEW'
    );
    expect(stats.inserted).toBe(1);
  });
});
