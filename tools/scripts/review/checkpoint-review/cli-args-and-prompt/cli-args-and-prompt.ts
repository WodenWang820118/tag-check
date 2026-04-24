import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type {
  ParsedCliArgs,
  ReviewCheckpoint,
  ReviewExecution,
  ReviewProvider
} from '../shared/shared.ts';

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const parsed: ParsedCliArgs = {
    provider: 'auto',
    focus: 'general'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--checkpoint') {
      parsed.checkpoint = readCheckpointFlag(argv[index + 1]);
      index += 1;
      continue;
    }

    if (current === '--focus') {
      parsed.focus = readRequiredValue(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--provider') {
      parsed.provider = readProviderFlag(argv[index + 1]);
      index += 1;
      continue;
    }

    if (current === '--model') {
      parsed.model = readRequiredValue(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--context-file') {
      parsed.contextFile = readRequiredValue(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown review flag: ${current}`);
  }

  return parsed;
}

export function buildReviewPrompt(
  execution: ReviewExecution,
  context: string
): string {
  const reviewRules = [
    'You are the second-opinion reviewer for this repository.',
    `Checkpoint: ${execution.checkpoint}`,
    `Primary focus: ${execution.focus}`,
    execution.model ? `Requested model: ${execution.model}` : null,
    '',
    'Review rules:',
    '- Findings first, ordered by severity',
    '- Call out correctness, security risk, workflow violations, contract drift, and missing tests',
    execution.checkpoint === 'test'
      ? '- Focus on missing scenarios, weak assertions, and regression gaps'
      : null,
    execution.checkpoint === 'implementation'
      ? '- If blocking issues remain, call out whether this should be escalated to Copilot for a follow-up review'
      : null,
    '',
    'Context to review:',
    context.trim()
  ].filter(Boolean);

  return reviewRules.join('\n');
}

export async function readReviewContext(contextFile?: string): Promise<string> {
  if (contextFile) {
    const resolvedPath = resolve(contextFile);
    if (!existsSync(resolvedPath)) {
      throw new Error(`Context file not found: ${resolvedPath}`);
    }

    return readFileSync(resolvedPath, 'utf8');
  }

  return readStdin();
}

function readRequiredValue(
  argv: string[],
  index: number,
  flag: string
): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

function readCheckpointFlag(rawValue?: string): ReviewCheckpoint {
  if (
    rawValue === 'plan' ||
    rawValue === 'implementation' ||
    rawValue === 'test' ||
    rawValue === 'pre-merge'
  ) {
    return rawValue;
  }

  throw new Error(
    `Unsupported checkpoint "${rawValue ?? ''}". Expected one of: plan, implementation, test, pre-merge.`
  );
}

function readProviderFlag(rawValue?: string): ReviewProvider {
  if (
    rawValue === 'auto' ||
    rawValue === 'copilot' ||
    rawValue === 'gemini' ||
    rawValue === 'codex'
  ) {
    return rawValue;
  }

  throw new Error(
    `Unsupported provider "${rawValue ?? ''}". Expected one of: auto, copilot, gemini, codex.`
  );
}

function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return Promise.resolve('');
  }

  return new Promise((resolveInput, reject) => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
    });
    process.stdin.on('end', () => resolveInput(buffer));
    process.stdin.on('error', reject);
  });
}
