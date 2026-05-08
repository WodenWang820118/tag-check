import { describe, expect, it, vi } from 'vitest';
import { ProjectSlugService } from './project-slug.service';

describe('ProjectSlugService', () => {
  const service = new ProjectSlugService();

  function makeRepo(matches: Set<string>) {
    return {
      findOne: vi.fn(async ({ where }: { where: { projectSlug: string } }) =>
        matches.has(where.projectSlug) ? { id: 1 } : null
      )
    } as never;
  }

  it('returns the original baseSlug when no row matches', async () => {
    const result = await service.ensureUnique(makeRepo(new Set()), 'demo');
    expect(result).toBe('demo');
  });

  it('returns the empty baseSlug unchanged without querying the repo', async () => {
    const repo = { findOne: vi.fn() } as never;
    expect(await service.ensureUnique(repo, '')).toBe('');
    expect(
      (repo as { findOne: { mock: { calls: unknown[] } } }).findOne.mock.calls
    ).toHaveLength(0);
  });

  it('appends -2, -3 ... until it finds a free slug', async () => {
    const taken = new Set(['demo', 'demo-2']);
    const result = await service.ensureUnique(makeRepo(taken), 'demo');
    expect(result).toBe('demo-3');
  });
});
