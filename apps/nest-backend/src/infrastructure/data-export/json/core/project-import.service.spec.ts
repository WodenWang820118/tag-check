import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProjectImportService } from './project-import.service';
import { RowMaterializerService } from './row-materializer.service';
import { ProjectSlugService } from './project-slug.service';
import { IdMapRegistryService } from './id-map-registry.service';
import { RelationMapperService } from './relation-mapper.service';
import type { ImportStats } from '../../interfaces/import-types';
import {
  asRepository,
  entityMeta,
  importRepositoryMock
} from './import-repository.spec-helpers';

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
    set: vi.fn((_n, k, v) => map.set(k, v)),
    markCreated: vi.fn()
  } as unknown as IdMapRegistryService;
  const relationMapper = {
    register: vi.fn()
  } as unknown as RelationMapperService;
  return { materializer, slugService, registry, relationMapper, map };
}

const meta = entityMeta('ProjectEntity');
const pkInfo = { primaryIsSingle: true, primaryKeyProp: 'id' };

describe('ProjectImportService', () => {
  let stats: ImportStats;
  beforeEach(() => {
    stats = { skipped: 0, inserted: 0 };
  });

  it('skips rows that have no projectSlug', async () => {
    const d = deps();
    const svc = new ProjectImportService(
      d.materializer,
      d.slugService,
      d.registry,
      d.relationMapper
    );
    const repo = importRepositoryMock();
    const out = await svc.importProjectRows(
      [{ id: 'a' }],
      meta,
      asRepository(repo),
      pkInfo,
      stats,
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
    const repo = importRepositoryMock();
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockResolvedValue(existing);
    const out = await svc.importProjectRows(
      [{ id: 'OLD', projectSlug: 's', name: 'new', __exportRef: 'ref-1' }],
      meta,
      asRepository(repo),
      pkInfo,
      stats,
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
    const repo = importRepositoryMock();
    repo.findOne.mockResolvedValue(null);
    repo.create.mockReturnValue(created);
    repo.save.mockResolvedValue(created);
    const repository = asRepository(repo);
    vi.mocked(d.slugService.ensureUnique).mockResolvedValue('s-1');
    const out = await svc.importProjectRows(
      [{ id: 'OLD', projectSlug: 's' }],
      meta,
      repository,
      pkInfo,
      stats,
      {}
    );
    expect(out).toBe('NEW');
    expect(d.slugService.ensureUnique).toHaveBeenCalledWith(repository, 's');
    expect(repo.create).toHaveBeenCalled();
    expect(d.relationMapper.register).toHaveBeenCalledWith(
      'ProjectEntity',
      's-1',
      'NEW'
    );
    expect(stats.inserted).toBe(1);
  });
});
