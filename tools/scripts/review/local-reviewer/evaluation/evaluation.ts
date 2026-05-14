import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import {
  buildCheckpointReviewContext,
  collectChangedFiles,
  collectDiffText,
  runGitCommand,
} from '../diff-context/diff-context.ts';
import { getPnpmCommand } from '../environment/environment.ts';
import {
  buildPrefilterContext,
  getEscalationReasons,
  selectPaidReviewContext,
} from '../prefilter/prefilter.ts';
import { runLocalReviewerReview } from '../runner/runner.ts';
import {
  DEFAULT_EVALUATION_REPO_NAMES,
  DEFAULT_EVALUATION_ROUNDS,
  DEFAULT_SAMPLE_SEED,
  EVALUATION_ARTIFACT_DIR,
  EVALUATION_KIND_ORDER,
  EVALUATION_KIND_WEIGHTS,
  LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  type EvaluationLocalResult,
  type EvaluationRepoTarget,
  type EvaluationReviewerResult,
  type EvaluationSample,
  type LocalReviewerDependencies,
  type LocalReviewerEvaluationConfig,
  type LocalReviewReport,
} from '../shared/shared.ts';

export function resolveEvaluationRepoTargets(
  currentRepoRoot: string,
  requestedRepos: ReadonlyArray<string> = [],
): EvaluationRepoTarget[] {
  const repoInputs =
    requestedRepos.length > 0
      ? requestedRepos
      : [...DEFAULT_EVALUATION_REPO_NAMES];
  const resolvedTargets: EvaluationRepoTarget[] = [];
  const seenRoots = new Set<string>();

  for (const repoInput of repoInputs) {
    const target = resolveEvaluationRepoTarget(currentRepoRoot, repoInput);
    const normalizedRoot = target.root.toLowerCase();
    if (seenRoots.has(normalizedRoot)) {
      continue;
    }
    if (
      !existsSync(target.root) ||
      (!existsSync(resolve(target.root, '.git')) &&
        !existsSync(resolve(target.root, 'package.json')))
    ) {
      throw new Error(
        `Unable to find an evaluation repository at ${target.root}.`,
      );
    }

    resolvedTargets.push(target);
    seenRoots.add(normalizedRoot);
  }

  return resolvedTargets;
}

export function collectEvaluationSamples(input: {
  dependencies: LocalReviewerDependencies;
  repoTargets: ReadonlyArray<EvaluationRepoTarget>;
  rounds?: number;
  seed?: number;
}): EvaluationSample[] {
  const rounds = input.rounds ?? DEFAULT_EVALUATION_ROUNDS;
  const seed = input.seed ?? DEFAULT_SAMPLE_SEED;
  const candidates = input.repoTargets.flatMap((repo, index) =>
    sampleRepoCommits(
      repo.root,
      repo.name,
      input.dependencies,
      seed + index + 1,
    ),
  );

  return selectEvaluationSamples({
    candidates,
    rounds,
    seed,
  });
}

export function collectRepoCommitCandidates(input: {
  dependencies: LocalReviewerDependencies;
  repoName: string;
  repoRoot: string;
  seed: number;
}): EvaluationSample[] {
  return sampleRepoCommits(
    input.repoRoot,
    input.repoName,
    input.dependencies,
    input.seed,
  );
}

export function selectAbSamples(
  samples: ReadonlyArray<EvaluationSample>,
  desiredCount = 4,
): EvaluationSample[] {
  if (desiredCount <= 0) {
    return [];
  }

  const selected: EvaluationSample[] = [];
  const remaining = [...samples];
  const preferredOrder: EvaluationSample['kind'][] = [
    'small-ts',
    'multi-file-refactor',
    'workspace-config',
    'higher-risk',
    'general',
  ];

  for (const kind of preferredOrder) {
    if (selected.length >= desiredCount) {
      break;
    }
    const index = remaining.findIndex((sample) => sample.kind === kind);
    if (index === -1) {
      continue;
    }

    selected.push(remaining[index]!);
    remaining.splice(index, 1);
  }

  while (selected.length < desiredCount && remaining.length > 0) {
    selected.push(remaining.shift()!);
  }

  return selected;
}

export function summarizeEvaluation(input: {
  config: LocalReviewerEvaluationConfig;
  localResults: ReadonlyArray<EvaluationLocalResult>;
  reviewerResults: ReadonlyArray<EvaluationReviewerResult>;
  repoRoot: string;
}): {
  artifacts: {
    abResultsPath: string;
    localResultsPath: string;
    samplesPath: string;
    summaryPath: string;
  };
  summaryMarkdown: string;
} {
  const artifactRoot = resolve(input.repoRoot, ...EVALUATION_ARTIFACT_DIR);
  mkdirSync(artifactRoot, { recursive: true });

  const samplesPath = resolve(artifactRoot, 'samples.json');
  const localResultsPath = resolve(artifactRoot, 'local-results.json');
  const abResultsPath = resolve(artifactRoot, 'ab-results.json');
  const summaryPath = resolve(artifactRoot, 'summary.md');

  const samplePayload = input.localResults.map((result) => result.sample);
  writeFileSync(samplesPath, JSON.stringify(samplePayload, null, 2), 'utf8');
  writeFileSync(
    localResultsPath,
    JSON.stringify(input.localResults, null, 2),
    'utf8',
  );
  writeFileSync(
    abResultsPath,
    JSON.stringify(input.reviewerResults, null, 2),
    'utf8',
  );

  const summaryMarkdown = renderEvaluationSummary(
    input.localResults,
    input.reviewerResults,
    input.config,
  );
  writeFileSync(summaryPath, `${summaryMarkdown.trim()}\n`, 'utf8');

  return {
    artifacts: {
      abResultsPath,
      localResultsPath,
      samplesPath,
      summaryPath,
    },
    summaryMarkdown,
  };
}

export function evaluateSampleWithLocalReviewer(input: {
  dependencies: LocalReviewerDependencies;
  env?: NodeJS.ProcessEnv;
  sample: EvaluationSample;
  smallDiffThresholdChars?: number;
  toolRepoRoot: string;
}): EvaluationLocalResult {
  const startedAt = Date.now();
  const diffText = collectDiffText({
    baseRef: input.sample.baseRef,
    dependencies: input.dependencies,
    headRef: input.sample.commit,
    repoRoot: input.sample.repoRoot,
    staged: false,
  });
  const diffLength = diffText.length;

  try {
    const report = runLocalReviewerReview({
      baseRef: input.sample.baseRef,
      dependencies: input.dependencies,
      env: input.env,
      headRef: input.sample.commit,
      staged: false,
      targetRepoRoot: input.sample.repoRoot,
      toolRepoRoot: input.toolRepoRoot,
    });
    const contextMarkdown = buildPrefilterContext({
      diffText,
      escalationReasons: getEscalationReasons({
        diffText,
        fileCount: input.sample.fileCount,
        findings: report.findings,
        changedFiles: report.context.files.map((file) => file.path),
      }),
      findings: report.findings,
      report,
    });
    const escalationReasons = getEscalationReasons({
      diffText,
      fileCount: input.sample.fileCount,
      findings: report.findings,
      changedFiles: report.context.files.map((file) => file.path),
    });
    const reviewContextSelection = selectPaidReviewContext({
      diffText,
      prefilterContext: contextMarkdown,
      smallDiffThresholdChars: input.smallDiffThresholdChars,
    });

    return {
      durationMs: Date.now() - startedAt,
      diffLength,
      findingsCount: report.findings.length,
      jsonParseable: true,
      paidReviewContextLength:
        escalationReasons.length > 0 ? reviewContextSelection.contextLength : 0,
      prefilterContextLength: contextMarkdown.length,
      recommendedEscalation: escalationReasons.length > 0,
      escalationReasons,
      report,
      reviewContextLength: reviewContextSelection.contextLength,
      reviewContextMode: reviewContextSelection.mode,
      sample: input.sample,
      success: true,
      summaryLength: contextMarkdown.length,
    };
  } catch (error) {
    const errorText = error instanceof Error ? error.message : String(error);
    return {
      durationMs: Date.now() - startedAt,
      diffLength,
      error: errorText,
      findingsCount: 0,
      jsonParseable: false,
      paidReviewContextLength: diffLength,
      prefilterContextLength: 0,
      recommendedEscalation: true,
      escalationReasons: getEscalationReasons({
        diffText,
        fileCount: input.sample.fileCount,
        findings: [],
        changedFiles: [],
        localReviewError: errorText,
      }),
      reviewContextLength: diffLength,
      reviewContextMode: 'full-diff',
      sample: input.sample,
      success: false,
      summaryLength: 0,
    };
  }
}

export function evaluateSampleWithCheckpointReview(input: {
  dependencies: LocalReviewerDependencies;
  sample: EvaluationSample;
}): EvaluationReviewerResult {
  const startedAt = Date.now();
  const changedFiles = collectChangedFiles({
    baseRef: input.sample.baseRef,
    dependencies: input.dependencies,
    headRef: input.sample.commit,
    repoRoot: input.sample.repoRoot,
    staged: false,
  });
  const context = buildCheckpointReviewContext({
    changedFiles,
    diffText: collectDiffText({
      baseRef: input.sample.baseRef,
      dependencies: input.dependencies,
      headRef: input.sample.commit,
      repoRoot: input.sample.repoRoot,
      staged: false,
    }),
    sample: input.sample,
  });

  const result = input.dependencies.runProcess({
    command: getPnpmCommand(),
    args: ['review:implementation', '--', '--focus', 'general'],
    cwd: input.sample.repoRoot,
    input: context,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  });

  return {
    durationMs: Date.now() - startedAt,
    error:
      result.error?.message ||
      (result.status === 0
        ? undefined
        : result.stderr.trim() || result.stdout.trim()),
    output: result.stdout.trim(),
    providerAvailable: result.status === 0,
    sample: input.sample,
    success: result.status === 0,
  };
}

function renderEvaluationSummary(
  localResults: ReadonlyArray<EvaluationLocalResult>,
  reviewerResults: ReadonlyArray<EvaluationReviewerResult>,
  config: LocalReviewerEvaluationConfig,
): string {
  const total = localResults.length;
  const successful = localResults.filter((result) => result.success).length;
  const parseable = localResults.filter(
    (result) => result.jsonParseable,
  ).length;
  const escalated = localResults.filter(
    (result) => result.recommendedEscalation,
  ).length;
  const localMedianMs = median(localResults.map((result) => result.durationMs));
  const findingMedian = median(
    localResults.map((result) => result.findingsCount),
  );
  const baselineDiffChars = localResults.reduce(
    (sum, result) => sum + result.diffLength,
    0,
  );
  const paidReviewContextChars = localResults.reduce(
    (sum, result) => sum + result.paidReviewContextLength,
    0,
  );
  const actualContextRatios = localResults
    .filter((result) => result.recommendedEscalation && result.diffLength > 0)
    .map((result) => result.paidReviewContextLength / result.diffLength);
  const averageCompressionRatio =
    actualContextRatios.length > 0
      ? actualContextRatios.reduce((sum, value) => sum + value, 0) /
        actualContextRatios.length
      : 0;
  const trafficSavingsPct =
    baselineDiffChars > 0
      ? ((baselineDiffChars - paidReviewContextChars) / baselineDiffChars) * 100
      : 0;

  const sampleLines = localResults.map((result) => {
    const reviewer = reviewerResults.find(
      (entry) =>
        entry.sample.repoName === result.sample.repoName &&
        entry.sample.commit === result.sample.commit,
    );
    const paidContext = result.recommendedEscalation
      ? `${result.reviewContextMode} (${result.paidReviewContextLength})`
      : 'not-needed';
    return `| ${result.sample.repoName} | ${result.sample.kind} | ${shortHash(result.sample.commit)} | ${result.success ? 'ok' : 'fail'} | ${result.findingsCount} | ${result.recommendedEscalation ? 'yes' : 'no'} | ${paidContext} | ${deriveVerdict(result, reviewer)} |`;
  });

  return [
    '# Local Reviewer Evaluation Summary',
    '',
    `- Benchmark mode: ${config.abSampleCount > 0 ? `estimate + ${reviewerResults.length} A/B review sample(s)` : 'estimate-only'}`,
    `- Local parallel jobs: ${config.jobs}`,
    `- Repo pool: ${config.repoNames.join(', ')}`,
    `- Requested rounds: ${config.rounds}`,
    `- Small diff threshold: ${config.smallDiffThresholdChars} chars`,
    `- Samples: ${successful}/${total} local reviews succeeded`,
    `- JSON parse rate: ${parseable}/${total}`,
    `- Median duration: ${localMedianMs} ms`,
    `- Median findings: ${findingMedian}`,
    `- Estimated paid review requests: ${escalated}/${total}`,
    `- Estimated paid review context chars: ${paidReviewContextChars}/${baselineDiffChars} (${trafficSavingsPct.toFixed(1)}% saved)`,
    `- Average paid/original diff char ratio: ${averageCompressionRatio.toFixed(2)}`,
    '',
    '| Repo | Kind | Commit | Local Result | Findings | Escalate | Paid Context | Verdict |',
    '| --- | --- | --- | --- | --- | --- | --- | --- |',
    ...sampleLines,
  ].join('\n');
}

function sampleRepoCommits(
  repoRoot: string,
  repoName: string,
  dependencies: LocalReviewerDependencies,
  seed: number,
): EvaluationSample[] {
  const sinceDate = new Date(
    Date.now() - 60 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const logResult = runGitCommand(
    repoRoot,
    ['log', '--since', sinceDate, '--no-merges', '--format=%H%x1f%ct%x1f%s'],
    dependencies,
  );

  const candidates = logResult.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [commit, epochRaw, subject] = line.split('\u001f');
      const baseRef = resolveParentCommit(repoRoot, commit, dependencies);
      if (!baseRef) {
        return null;
      }

      const numstat = runGitCommand(
        repoRoot,
        ['diff', '--numstat', baseRef, commit],
        dependencies,
      ).stdout;
      const parsed = parseNumstat(numstat);
      if (parsed.binary || parsed.fileCount === 0 || parsed.fileCount > 20) {
        return null;
      }

      return {
        baseRef,
        commit,
        committedAtEpoch: Number.parseInt(epochRaw ?? '0', 10),
        fileCount: parsed.fileCount,
        kind: classifySample(parsed.files, parsed.totalChangedLines),
        repoName,
        repoRoot,
        subject: subject ?? '<no subject>',
        totalChangedLines: parsed.totalChangedLines,
      } satisfies EvaluationSample;
    })
    .filter((sample): sample is EvaluationSample => sample !== null);

  return shuffleWithSeed(candidates, seed);
}

function classifySample(
  files: string[],
  totalChangedLines: number,
): EvaluationSample['kind'] {
  if (
    files.some((file) =>
      /(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|nx\.json|tsconfig|project\.json|\.ya?ml|\.json|\.toml|README\.md)$/i.test(
        file,
      ),
    )
  ) {
    return 'workspace-config';
  }

  if (
    files.some((file) =>
      /(auth|secret|token|password|migration|database|schema|controller|dto)/i.test(
        file,
      ),
    )
  ) {
    return 'higher-risk';
  }

  if (files.length >= 4) {
    return 'multi-file-refactor';
  }

  const codeFiles = files.filter((file) =>
    /\.(ts|tsx|mts|cts|js|jsx|mjs|cjs)$/i.test(file),
  );
  if (
    codeFiles.length === files.length &&
    files.length <= 2 &&
    totalChangedLines <= 120
  ) {
    return 'small-ts';
  }

  return 'general';
}

function resolveEvaluationRepoTarget(
  currentRepoRoot: string,
  repoInput: string,
): EvaluationRepoTarget {
  if (
    (DEFAULT_EVALUATION_REPO_NAMES as readonly string[]).includes(repoInput)
  ) {
    return {
      name: repoInput,
      root: resolve(currentRepoRoot, '..', repoInput),
    };
  }

  const root = resolve(currentRepoRoot, repoInput);
  return {
    name: basename(root),
    root,
  };
}

export function selectEvaluationSamples(input: {
  candidates: ReadonlyArray<EvaluationSample>;
  rounds: number;
  seed: number;
}): EvaluationSample[] {
  if (input.rounds <= 0 || input.candidates.length === 0) {
    return [];
  }

  const selected: EvaluationSample[] = [];
  const chosenKeys = new Set<string>();
  const quotas = buildSoftSampleQuotas(input.rounds);

  for (const [index, kind] of EVALUATION_KIND_ORDER.entries()) {
    const pool = shuffleWithSeed(
      input.candidates.filter((sample) => sample.kind === kind),
      input.seed + index + 11,
    );
    for (const sample of pool.slice(0, quotas[kind])) {
      const key = `${sample.repoName}:${sample.commit}`;
      if (chosenKeys.has(key)) {
        continue;
      }
      selected.push(sample);
      chosenKeys.add(key);
    }
  }

  if (selected.length < input.rounds) {
    const remaining = shuffleWithSeed(
      input.candidates.filter(
        (sample) => !chosenKeys.has(`${sample.repoName}:${sample.commit}`),
      ),
      input.seed + 101,
    );
    selected.push(...remaining.slice(0, input.rounds - selected.length));
  }

  return interleaveEvaluationSamples(selected, input.seed);
}

function buildSoftSampleQuotas(
  rounds: number,
): Record<EvaluationSample['kind'], number> {
  const quotas = Object.fromEntries(
    EVALUATION_KIND_ORDER.map((kind) => [kind, 0]),
  ) as Record<EvaluationSample['kind'], number>;
  const totals = EVALUATION_KIND_ORDER.map((kind) => ({
    exact: (rounds * EVALUATION_KIND_WEIGHTS[kind]) / DEFAULT_EVALUATION_ROUNDS,
    kind,
  }));

  let allocated = 0;
  for (const entry of totals) {
    const floored = Math.floor(entry.exact);
    quotas[entry.kind] = floored;
    allocated += floored;
  }

  const remainder = Math.max(rounds - allocated, 0);
  const byRemainder = [...totals].sort((left, right) => {
    const leftRemainder = left.exact - Math.floor(left.exact);
    const rightRemainder = right.exact - Math.floor(right.exact);
    return rightRemainder - leftRemainder;
  });

  for (const entry of byRemainder.slice(0, remainder)) {
    quotas[entry.kind] += 1;
  }

  return quotas;
}

function interleaveEvaluationSamples(
  samples: ReadonlyArray<EvaluationSample>,
  seed: number,
): EvaluationSample[] {
  const queues = new Map<EvaluationSample['kind'], EvaluationSample[]>();
  for (const [index, kind] of EVALUATION_KIND_ORDER.entries()) {
    queues.set(
      kind,
      shuffleWithSeed(
        samples.filter((sample) => sample.kind === kind),
        seed + index + 151,
      ),
    );
  }

  const output: EvaluationSample[] = [];
  while ([...queues.values()].some((queue) => queue.length > 0)) {
    for (const kind of EVALUATION_KIND_ORDER) {
      const queue = queues.get(kind);
      if (queue && queue.length > 0) {
        output.push(queue.shift()!);
      }
    }
  }

  return output;
}

function parseNumstat(stdout: string): {
  binary: boolean;
  fileCount: number;
  files: string[];
  totalChangedLines: number;
} {
  let binary = false;
  let totalChangedLines = 0;
  const files: string[] = [];

  for (const line of stdout.split(/\r?\n/)) {
    const normalized = line.trim();
    if (!normalized) {
      continue;
    }

    const [addedRaw, deletedRaw, filePath] = normalized.split('\t');
    if (!filePath) {
      continue;
    }
    if (addedRaw === '-' || deletedRaw === '-') {
      binary = true;
      break;
    }

    files.push(filePath);
    totalChangedLines += Number.parseInt(addedRaw ?? '0', 10);
    totalChangedLines += Number.parseInt(deletedRaw ?? '0', 10);
  }

  return {
    binary,
    fileCount: files.length,
    files,
    totalChangedLines,
  };
}

function resolveParentCommit(
  repoRoot: string,
  commit: string,
  dependencies: LocalReviewerDependencies,
): string | null {
  const result = dependencies.runProcess({
    command: 'git',
    args: ['rev-parse', `${commit}^`],
    cwd: repoRoot,
    timeoutMs: LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  });

  if (result.error || result.status !== 0) {
    return null;
  }

  return result.stdout.trim() || null;
}

function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  const random = mulberry32(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}

function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

function shortHash(commit: string): string {
  return commit.slice(0, 7);
}

function deriveVerdict(
  localResult: EvaluationLocalResult,
  reviewerResult?: EvaluationReviewerResult,
): 'usable-prefilter' | 'needs-escalation' | 'misleading' {
  if (!localResult.success || localResult.recommendedEscalation) {
    return 'needs-escalation';
  }

  if (
    reviewerResult?.success &&
    /\b(critical|high|blocking|security risk|public contract)\b/i.test(
      reviewerResult.output,
    )
  ) {
    return 'misleading';
  }

  return 'usable-prefilter';
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1]! + sorted[middle]!) / 2)
    : sorted[middle]!;
}
