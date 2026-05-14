import { availableParallelism, cpus } from 'node:os';
import { basename } from 'node:path';

import {
  DEFAULT_EVALUATION_AB_SAMPLE_COUNT,
  DEFAULT_EVALUATION_ROUNDS,
  DEFAULT_SAMPLE_SEED,
  DEFAULT_SMALL_DIFF_THRESHOLD_CHARS
} from './shared/shared.ts';

export type LocalReviewerCommand =
  | 'doctor'
  | 'evaluate'
  | 'prefilter'
  | 'staged';

export interface ParsedLocalReviewerCliArgs {
  abSamples: number;
  command: LocalReviewerCommand;
  jobs: number;
  repos: string[];
  rounds: number;
  seed: number;
  smallDiffThresholdChars: number;
}

export function parseCliArgs(
  argv: string[] = process.argv.slice(2)
): ParsedLocalReviewerCliArgs {
  const command = parseCommand(argv[0]);
  const parsed: ParsedLocalReviewerCliArgs = {
    abSamples: DEFAULT_EVALUATION_AB_SAMPLE_COUNT,
    command,
    jobs: getDefaultEvaluationJobs(),
    repos: [],
    rounds: DEFAULT_EVALUATION_ROUNDS,
    seed: DEFAULT_SAMPLE_SEED,
    smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS
  };

  for (let index = 1; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--rounds') {
      parsed.rounds = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--seed') {
      parsed.seed = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--small-diff-threshold-chars') {
      parsed.smallDiffThresholdChars = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--ab-samples') {
      parsed.abSamples = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--jobs') {
      parsed.jobs = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--repo') {
      parsed.repos.push(readStringFlag(argv, index, current));
      index += 1;
      continue;
    }

    throw new Error(`${getUsageText()}\n\nUnknown flag: ${current}`);
  }

  return parsed;
}

export function getUsageText(scriptName = 'local-reviewer.ts'): string {
  return [
    `Usage: node ${scriptName} <doctor|staged|prefilter|evaluate> [options]`,
    '',
    'Options:',
    `  --small-diff-threshold-chars <n>  Override the small diff cutoff (default: ${DEFAULT_SMALL_DIFF_THRESHOLD_CHARS})`,
    `  --rounds <n>                      Evaluation rounds for \`evaluate\` (default: ${DEFAULT_EVALUATION_ROUNDS})`,
    `  --seed <n>                        Deterministic sample seed for \`evaluate\` (default: ${DEFAULT_SAMPLE_SEED})`,
    `  --ab-samples <n>                  Optional paid-review A/B sample count for \`evaluate\` (default: ${DEFAULT_EVALUATION_AB_SAMPLE_COUNT})`,
    `  --jobs <n>                        Local parallel worker count for \`evaluate\` (default: ${getDefaultEvaluationJobs()})`,
    '  --repo <path-or-name>             Additional evaluation repo target; repeatable'
  ].join('\n');
}

export function getDefaultEvaluationJobs(): number {
  try {
    return Math.max(1, Math.min(4, availableParallelism()));
  } catch {
    return Math.max(1, Math.min(4, cpus().length || 1));
  }
}

export function readIntegerFlag(
  argv: string[],
  index: number,
  flag: string
): number {
  const rawValue = argv[index + 1];
  if (!rawValue) {
    throw new Error(`${getUsageText()}\n\nMissing value for ${flag}.`);
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${flag} requires a non-negative integer.`);
  }

  return parsed;
}

export function readStringFlag(
  argv: string[],
  index: number,
  flag: string
): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`${getUsageText()}\n\nMissing value for ${flag}.`);
  }

  return value;
}

export function readPossiblyEmptyStringFlag(
  argv: string[],
  index: number,
  flag: string
): string {
  if (index + 1 >= argv.length) {
    throw new Error(`${getUsageText()}\n\nMissing value for ${flag}.`);
  }

  return argv[index + 1] ?? '';
}

function parseCommand(rawValue?: string): LocalReviewerCommand {
  if (
    rawValue === 'doctor' ||
    rawValue === 'staged' ||
    rawValue === 'prefilter' ||
    rawValue === 'evaluate'
  ) {
    return rawValue;
  }

  throw new Error(getUsageText(resolveUsageScriptName()));
}

function resolveUsageScriptName(): string {
  return basename(process.argv[1] ?? 'local-reviewer.ts');
}
