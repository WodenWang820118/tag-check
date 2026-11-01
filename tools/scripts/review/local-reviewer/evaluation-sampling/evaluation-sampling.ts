import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

import {
  DEFAULT_EVALUATION_ROUNDS,
  type EvaluationLocalResult,
  EVALUATION_ARTIFACT_DIR,
  type EvaluationReviewerResult,
  type EvaluationSample,
  EVALUATION_KIND_ORDER,
  EVALUATION_KIND_WEIGHTS,
  type LocalReviewerEvaluationConfig,
  median,
  normalizeHybridPath,
  shortHash,
  shuffleWithSeed
} from '../shared/shared.ts';

export function buildCheckpointReviewContext(input: {
  changedFiles: ReadonlyArray<string>;
  diffText: string;
  sample: EvaluationSample;
}): string {
  return [
    `Repository: ${input.sample.repoName}`,
    `Commit: ${input.sample.commit}`,
    `Base ref: ${input.sample.baseRef}`,
    `Head ref: ${input.sample.commit}`,
    `Subject: ${input.sample.subject}`,
    `Kind: ${input.sample.kind}`,
    '',
    'Changed files:',
    ...input.changedFiles.map((file) => `- ${normalizeHybridPath(file)}`),
    '',
    'Diff to review:',
    input.diffText.trim()
  ].join('\n');
}

export function selectAbSamples(
  samples: ReadonlyArray<EvaluationSample>,
  desiredCount = 4
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
    'general'
  ];

  for (const kind of preferredOrder) {
    if (selected.length >= desiredCount) {
      break;
    }
    const index = remaining.findIndex((sample) => sample.kind === kind);
    if (index === -1) {
      continue;
    }

    selected.push(...remaining.splice(index, 1));
  }

  selected.push(...remaining.splice(0, desiredCount - selected.length));

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
    'utf8'
  );
  writeFileSync(
    abResultsPath,
    JSON.stringify(input.reviewerResults, null, 2),
    'utf8'
  );

  const summaryMarkdown = renderEvaluationSummary(
    input.localResults,
    input.reviewerResults,
    input.config
  );
  writeFileSync(summaryPath, `${summaryMarkdown.trim()}\n`, 'utf8');

  return {
    artifacts: {
      abResultsPath,
      localResultsPath,
      samplesPath,
      summaryPath
    },
    summaryMarkdown
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
      input.seed + index + 11
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
        (sample) => !chosenKeys.has(`${sample.repoName}:${sample.commit}`)
      ),
      input.seed + 101
    );
    selected.push(...remaining.slice(0, input.rounds - selected.length));
  }

  return interleaveEvaluationSamples(selected, input.seed);
}

function renderEvaluationSummary(
  localResults: ReadonlyArray<EvaluationLocalResult>,
  reviewerResults: ReadonlyArray<EvaluationReviewerResult>,
  config: LocalReviewerEvaluationConfig
): string {
  const total = localResults.length;
  const successful = localResults.filter((result) => result.success).length;
  const parseable = localResults.filter(
    (result) => result.jsonParseable
  ).length;
  const escalated = localResults.filter(
    (result) => result.recommendedEscalation
  ).length;
  const localMedianMs = median(localResults.map((result) => result.durationMs));
  const findingMedian = median(
    localResults.map((result) => result.findingsCount)
  );
  const baselineDiffChars = localResults.reduce(
    (sum, result) => sum + result.diffLength,
    0
  );
  const paidReviewContextChars = localResults.reduce(
    (sum, result) => sum + result.paidReviewContextLength,
    0
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
        entry.sample.commit === result.sample.commit
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
    ...sampleLines
  ].join('\n');
}

function buildSoftSampleQuotas(
  rounds: number
): Record<EvaluationSample['kind'], number> {
  const quotas = Object.fromEntries(
    EVALUATION_KIND_ORDER.map((kind) => [kind, 0])
  ) as Record<EvaluationSample['kind'], number>;
  const totals = EVALUATION_KIND_ORDER.map((kind) => ({
    exact: (rounds * EVALUATION_KIND_WEIGHTS[kind]) / DEFAULT_EVALUATION_ROUNDS,
    kind
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
  seed: number
): EvaluationSample[] {
  const queues = new Map<EvaluationSample['kind'], EvaluationSample[]>();
  for (const [index, kind] of EVALUATION_KIND_ORDER.entries()) {
    queues.set(
      kind,
      shuffleWithSeed(
        samples.filter((sample) => sample.kind === kind),
        seed + index + 151
      )
    );
  }

  const output: EvaluationSample[] = [];
  while ([...queues.values()].some((queue) => queue.length > 0)) {
    for (const kind of EVALUATION_KIND_ORDER) {
      const next = queues.get(kind)?.shift();
      if (next) {
        output.push(next);
      }
    }
  }

  return output;
}

function deriveVerdict(
  localResult: EvaluationLocalResult,
  reviewerResult?: EvaluationReviewerResult
): 'usable-prefilter' | 'needs-escalation' | 'misleading' {
  if (!localResult.success || localResult.recommendedEscalation) {
    return 'needs-escalation';
  }

  if (
    reviewerResult?.success &&
    /\b(critical|high|blocking|security risk|public contract)\b/i.test(
      reviewerResult.output
    )
  ) {
    return 'misleading';
  }

  return 'usable-prefilter';
}
