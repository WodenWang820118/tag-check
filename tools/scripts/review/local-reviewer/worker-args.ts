import {
  DEFAULT_SAMPLE_SEED,
  DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
  type HybridLocalMode,
  type HybridReviewProfileName
} from './shared/shared.ts';
import {
  readIntegerFlag,
  readPossiblyEmptyStringFlag,
  readStringFlag
} from './cli-args.ts';

export function parseCollectCandidatesArgs(argv: string[]): {
  repoName: string;
  repoRoot: string;
  seed: number;
} {
  const parsed = {
    repoName: '',
    repoRoot: '',
    seed: DEFAULT_SAMPLE_SEED
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--repo-name') {
      parsed.repoName = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--repo-root') {
      parsed.repoRoot = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--seed') {
      parsed.seed = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal worker flag: ${current}`);
  }

  if (!parsed.repoName || !parsed.repoRoot) {
    throw new Error('Missing required internal repo candidate worker args.');
  }

  return parsed;
}

export function parseEvaluateSampleArgs(argv: string[]): {
  sampleBase64: string;
  smallDiffThresholdChars: number;
  toolRepoRoot: string;
} {
  const parsed = {
    sampleBase64: '',
    smallDiffThresholdChars: DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
    toolRepoRoot: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--sample-base64') {
      parsed.sampleBase64 = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--small-diff-threshold-chars') {
      parsed.smallDiffThresholdChars = readIntegerFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--tool-repo-root') {
      parsed.toolRepoRoot = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal worker flag: ${current}`);
  }

  if (!parsed.sampleBase64 || !parsed.toolRepoRoot) {
    throw new Error('Missing required internal sample worker args.');
  }

  return parsed;
}

export function parseHybridGptWorkerArgs(argv: string[]): {
  changedFilesBase64: string;
  diffBase64: string;
} {
  const parsed = {
    changedFilesBase64: '',
    diffBase64: ''
  };
  let sawChangedFilesBase64 = false;
  let sawDiffBase64 = false;

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--changed-files-base64') {
      parsed.changedFilesBase64 = readPossiblyEmptyStringFlag(
        argv,
        index,
        current
      );
      sawChangedFilesBase64 = true;
      index += 1;
      continue;
    }
    if (current === '--diff-base64') {
      parsed.diffBase64 = readPossiblyEmptyStringFlag(argv, index, current);
      sawDiffBase64 = true;
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal hybrid GPT worker flag: ${current}`);
  }

  if (!sawChangedFilesBase64 || !sawDiffBase64) {
    throw new Error('Missing required hybrid GPT worker args.');
  }

  return parsed;
}

export function parseHybridLocalWorkerArgs(argv: string[]): {
  localMode: Exclude<HybridLocalMode, 'skipped'>;
  requestedProfiles: string;
  toolRepoRoot: string;
} {
  const parsed = {
    localMode: 'full' as Exclude<HybridLocalMode, 'skipped'>,
    requestedProfiles: '',
    toolRepoRoot: ''
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (current === '--local-mode') {
      const rawValue = readStringFlag(argv, index, current);
      if (rawValue !== 'full' && rawValue !== 'targeted') {
        throw new Error(`Unsupported hybrid local mode: ${rawValue}`);
      }
      parsed.localMode = rawValue;
      index += 1;
      continue;
    }
    if (current === '--requested-profiles') {
      parsed.requestedProfiles = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }
    if (current === '--tool-repo-root') {
      parsed.toolRepoRoot = readStringFlag(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown internal hybrid local worker flag: ${current}`);
  }

  if (!parsed.toolRepoRoot) {
    throw new Error('Missing required hybrid local worker args.');
  }

  return parsed;
}

export function parseRequestedProfiles(
  requestedProfiles: string
): HybridReviewProfileName[] {
  const values = requestedProfiles
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  return values.filter(
    (entry): entry is HybridReviewProfileName =>
      entry === 'angular' ||
      entry === 'nest' ||
      entry === 'typescript' ||
      entry === 'repo-habits' ||
      entry === 'general'
  );
}
