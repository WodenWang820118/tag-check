import assert from 'node:assert/strict';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, it } from 'vitest';

import {
  findLcovFiles,
  mergeCoverage,
  shouldIncludeE2eCoverage
} from './merge-coverage.ts';

const tempRoots: string[] = [];

afterEach(() => {
  for (const root of tempRoots.splice(0)) {
    rmSync(root, { force: true, recursive: true });
  }
});

describe('mergeCoverage', () => {
  it('excludes the merged output and backend e2e coverage by default', async () => {
    const cwd = createTempWorkspace();
    writeLcov(cwd, 'coverage/apps/ng-frontend/lcov.info', 'SF:frontend.ts');
    writeLcov(cwd, 'coverage/apps/nest-backend/lcov.info', 'SF:backend.ts');
    writeLcov(cwd, 'coverage/apps/nest-backend-e2e/lcov.info', 'SF:e2e.ts');
    writeLcov(cwd, 'coverage/lcov.info', 'SF:stale-merged-output.ts');

    const result = await mergeCoverage({ cwd });
    const mergedReport = readFileSync(join(cwd, 'coverage/lcov.info'), 'utf8');

    assert.deepEqual(result.files, [
      'coverage/apps/nest-backend/lcov.info',
      'coverage/apps/ng-frontend/lcov.info'
    ]);
    assert.match(mergedReport, /SF:backend\.ts/);
    assert.match(mergedReport, /SF:frontend\.ts/);
    assert.doesNotMatch(mergedReport, /SF:e2e\.ts/);
    assert.doesNotMatch(mergedReport, /SF:stale-merged-output\.ts/);
    assert.equal(mergedReport.endsWith('\n'), true);
  });

  it('includes backend e2e coverage only when explicitly requested', async () => {
    const cwd = createTempWorkspace();
    writeLcov(cwd, 'coverage/apps/nest-backend/lcov.info', 'SF:backend.ts');
    writeLcov(cwd, 'coverage/apps/nest-backend-e2e/lcov.info', 'SF:e2e.ts');

    const files = await findLcovFiles({ cwd, includeE2eCoverage: true });
    const result = await mergeCoverage({ cwd, includeE2eCoverage: true });
    const mergedReport = readFileSync(join(cwd, 'coverage/lcov.info'), 'utf8');

    assert.deepEqual(
      new Set(files),
      new Set([
        'coverage/apps/nest-backend/lcov.info',
        'coverage/apps/nest-backend-e2e/lcov.info'
      ])
    );
    assert.deepEqual(result.files, files);
    assert.match(mergedReport, /SF:e2e\.ts/);
  });

  it('fails visibly when there are no source LCOV files', async () => {
    const cwd = createTempWorkspace();

    await assert.rejects(() => mergeCoverage({ cwd }), /No LCOV files found/);
  });

  it('keeps INCLUDE_E2E_COVERAGE intentionally explicit', () => {
    assert.equal(shouldIncludeE2eCoverage('1'), true);
    assert.equal(shouldIncludeE2eCoverage('true'), false);
    assert.equal(shouldIncludeE2eCoverage(undefined), false);
  });
});

function createTempWorkspace(): string {
  const root = mkdtempSync(join(tmpdir(), 'tag-check-coverage-'));
  tempRoots.push(root);
  return root;
}

function writeLcov(cwd: string, path: string, sourceFile: string): void {
  const absolutePath = join(cwd, path);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(
    absolutePath,
    ['TN:', sourceFile, 'DA:1,1', 'end_of_record', ''].join('\n'),
    'utf8'
  );
}
