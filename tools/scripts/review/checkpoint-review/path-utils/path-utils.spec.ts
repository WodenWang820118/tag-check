import { describe, expect, it } from 'vitest';
import {
  matchesPathPattern,
  normalizeReviewPath,
  normalizeReviewPathList
} from './path-utils.ts';

describe('normalizeReviewPath', () => {
  it('converts backslashes to forward slashes', () => {
    expect(normalizeReviewPath('apps\\foo\\bar.ts')).toBe('apps/foo/bar.ts');
  });

  it('strips Windows drive letters and leading slashes', () => {
    expect(normalizeReviewPath('C:/repo/apps/foo.ts')).toBe('apps/foo.ts');
    expect(normalizeReviewPath('//apps/foo.ts')).toBe('apps/foo.ts');
  });

  it('strips a leading "./" prefix', () => {
    expect(normalizeReviewPath('./libs/util.ts')).toBe('libs/util.ts');
  });

  it('anchors at a recognized workspace prefix when found mid-path', () => {
    expect(
      normalizeReviewPath('C:/users/dev/repo/apps/nest-backend/src/main.ts')
    ).toBe('apps/nest-backend/src/main.ts');
  });

  it('returns the trimmed path unchanged when no anchor is found', () => {
    expect(normalizeReviewPath('  some/random/path.ts  ')).toBe(
      'some/random/path.ts'
    );
  });
});

describe('normalizeReviewPathList', () => {
  it('normalizes each path and drops empty strings', () => {
    expect(
      normalizeReviewPathList(['apps\\a.ts', '', 'C:/repo/libs/b.ts'])
    ).toEqual(['apps/a.ts', 'libs/b.ts']);
  });
});

describe('matchesPathPattern', () => {
  it('returns true when any pattern matches the normalized path', () => {
    const patterns = [/^apps\//, /^libs\//];
    expect(matchesPathPattern('C:/repo/apps/foo.ts', patterns)).toBe(true);
  });

  it('returns false when no pattern matches', () => {
    expect(matchesPathPattern('docs/readme.md', [/^apps\//])).toBe(false);
  });
});
