import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

export const COMMON_REVIEW_CONTRACT_PATHS = [
  path.join('.agents', 'reviewers', 'common-review-contract.toml'),
  path.join('.codex', 'review', 'common-review-contract.toml'),
] as const;

export function resolveCommonReviewContractPath(
  repoRoot: string,
): string | undefined {
  for (const contractPath of COMMON_REVIEW_CONTRACT_PATHS) {
    const resolvedPath = path.join(repoRoot, contractPath);

    if (existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }

  return undefined;
}

export function readCommonReviewContract(repoRoot: string): string {
  const contractPath = resolveCommonReviewContractPath(repoRoot);

  if (!contractPath) {
    return '';
  }

  return extractTomlMultilineField(
    readFileSync(contractPath, 'utf8'),
    'developer_instructions',
  );
}

function extractTomlMultilineField(source: string, fieldName: string): string {
  const escapedFieldName = escapeRegExp(fieldName);
  const match = source.match(
    new RegExp(`${escapedFieldName}\\s*=\\s*"""([\\s\\S]*?)"""`),
  );

  return (match?.[1] ?? source).trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
