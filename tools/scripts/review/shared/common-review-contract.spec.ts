import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  readCommonReviewContract,
  resolveCommonReviewContractPath,
} from './common-review-contract.ts';

test('resolveCommonReviewContractPath prefers the shared .agents reviewer contract', () => {
  const repoRoot = makeTempRepo();
  try {
    writeContract(
      repoRoot,
      path.join('.codex', 'review', 'common-review-contract.toml'),
      'old contract',
    );
    writeContract(
      repoRoot,
      path.join('.agents', 'reviewers', 'common-review-contract.toml'),
      'new contract',
    );

    assert.equal(
      resolveCommonReviewContractPath(repoRoot),
      path.join(
        repoRoot,
        '.agents',
        'reviewers',
        'common-review-contract.toml',
      ),
    );
    assert.equal(readCommonReviewContract(repoRoot), 'new contract');
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('readCommonReviewContract falls back to the legacy Codex review path', () => {
  const repoRoot = makeTempRepo();
  try {
    writeContract(
      repoRoot,
      path.join('.codex', 'review', 'common-review-contract.toml'),
      'legacy contract',
    );

    assert.equal(
      resolveCommonReviewContractPath(repoRoot),
      path.join(repoRoot, '.codex', 'review', 'common-review-contract.toml'),
    );
    assert.equal(readCommonReviewContract(repoRoot), 'legacy contract');
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

test('readCommonReviewContract returns empty text when no contract exists', () => {
  const repoRoot = makeTempRepo();
  try {
    assert.equal(resolveCommonReviewContractPath(repoRoot), undefined);
    assert.equal(readCommonReviewContract(repoRoot), '');
  } finally {
    rmSync(repoRoot, { force: true, recursive: true });
  }
});

function makeTempRepo(): string {
  return mkdtempSync(path.join(tmpdir(), 'review-contract-'));
}

function writeContract(
  repoRoot: string,
  relativePath: string,
  developerInstructions: string,
): void {
  const filePath = path.join(repoRoot, relativePath);
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(
    filePath,
    `developer_instructions = """\n${developerInstructions}\n"""\n`,
    'utf8',
  );
}
