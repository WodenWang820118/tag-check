import { isMainModule } from '../../shared/entrypoint/entrypoint.ts';
import {
  buildGeminiBackoffRecommendationSummary,
  buildGeminiIntervalRecommendationSummary,
  buildGeminiReviewSessionSummaries,
  buildTimeoutRecommendationSummary,
  listProviderObservationBuckets,
  type GeminiBackoffRecommendationSummary,
  type GeminiIntervalRecommendationSummary,
  type ProviderObservationBucket,
  type ProviderObservabilityOperation,
  type ProviderObservabilityProvider,
  type TimeoutRecommendationSummary
} from '../provider-observability/provider-observability.ts';
import {
  getCopilotPolicyTimeoutMs,
  type CopilotPolicyOperation,
  getGeminiCurrentPolicy,
  getGeminiPolicyTimeoutMs,
  type GeminiPolicyOperation
} from '../provider-policies/provider-policies.ts';

export type ProviderDoctorFilter = 'all' | ProviderObservabilityProvider;

export interface ParsedProviderDoctorArgs {
  json: boolean;
  provider: ProviderDoctorFilter;
}

export interface ProviderDoctorBucketReport {
  bucketKey: string;
  callsite: ProviderObservationBucket['callsite'];
  capacityErrorCount: number;
  checkpoint?: ProviderObservationBucket['checkpoint'];
  geminiBackoffRecommendation?: GeminiBackoffRecommendationSummary;
  geminiIntervalRecommendation?: GeminiIntervalRecommendationSummary;
  geminiSessionCount?: number;
  model?: string;
  operation: ProviderObservabilityOperation;
  provider: ProviderObservabilityProvider;
  sampleCount: number;
  timeoutRecommendation?: TimeoutRecommendationSummary;
}

export interface ProviderDoctorReport {
  buckets: ProviderDoctorBucketReport[];
  generatedAt: string;
  provider: ProviderDoctorFilter;
}

export function parseCliArgs(
  argv: string[] = process.argv.slice(2)
): ParsedProviderDoctorArgs {
  const parsed: ParsedProviderDoctorArgs = {
    json: false,
    provider: 'all'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--json') {
      parsed.json = true;
      continue;
    }

    if (current === '--provider') {
      const rawValue = argv[index + 1];
      if (
        rawValue !== 'all' &&
        rawValue !== 'copilot' &&
        rawValue !== 'gemini'
      ) {
        throw new Error(
          `Unsupported --provider value "${rawValue ?? ''}". Expected one of: all, copilot, gemini.`
        );
      }

      parsed.provider = rawValue;
      index += 1;
      continue;
    }

    throw new Error(`${getUsageText()}\n\nUnknown flag: ${current}`);
  }

  return parsed;
}

export function getUsageText(scriptName = 'provider-doctor.ts'): string {
  return [
    `Usage: node ${scriptName} [--provider <all|copilot|gemini>] [--json]`,
    '',
    'Options:',
    '  --provider <all|copilot|gemini>  Filter the report to a single provider (default: all)',
    '  --json                           Print the report as JSON'
  ].join('\n');
}

export function buildProviderDoctorReport(input: {
  provider: ProviderDoctorFilter;
  repoRoot?: string;
}): ProviderDoctorReport {
  const buckets = listProviderObservationBuckets({
    provider: input.provider === 'all' ? undefined : input.provider,
    repoRoot: input.repoRoot
  });

  return {
    buckets: buckets.map(buildBucketReport),
    generatedAt: new Date().toISOString(),
    provider: input.provider
  };
}

export function formatProviderDoctorReport(
  report: ProviderDoctorReport
): string {
  if (report.buckets.length === 0) {
    return [
      'Provider observability doctor',
      `Generated at: ${report.generatedAt}`,
      `Provider filter: ${report.provider}`,
      '',
      'No provider observations recorded yet.'
    ].join('\n');
  }

  const sections = [
    'Provider observability doctor',
    `Generated at: ${report.generatedAt}`,
    `Provider filter: ${report.provider}`,
    ''
  ];

  for (const bucket of report.buckets) {
    sections.push(`Bucket: ${describeBucket(bucket)}`);
    sections.push(`Samples: ${bucket.sampleCount}`);
    sections.push(`Capacity errors: ${bucket.capacityErrorCount}`);

    if (bucket.timeoutRecommendation) {
      sections.push(
        `Timeout stats: success=${bucket.timeoutRecommendation.successCount}/${bucket.timeoutRecommendation.sampleCount}, timeouts=${bucket.timeoutRecommendation.timeoutCount} (${formatRate(bucket.timeoutRecommendation.timeoutRate)})`
      );
      sections.push(
        `Timeout p50/p95: ${formatMs(bucket.timeoutRecommendation.p50DurationMs)} / ${formatMs(bucket.timeoutRecommendation.p95DurationMs)}`
      );
      sections.push(
        `Current timeout: ${formatMs(bucket.timeoutRecommendation.currentTimeoutMs)}`
      );
      sections.push(
        bucket.timeoutRecommendation.insufficientData
          ? 'Recommended timeout: insufficient data'
          : `Recommended timeout: ${formatMs(bucket.timeoutRecommendation.recommendedTimeoutMs)}`
      );
    }

    if (bucket.geminiIntervalRecommendation) {
      sections.push(
        `Gemini sessions: ${bucket.geminiIntervalRecommendation.sessionCount}`
      );
      sections.push(
        `First-attempt capacity rate: ${formatRate(bucket.geminiIntervalRecommendation.firstAttemptCapacityRate)}`
      );
      sections.push(
        `Current interval: ${formatMs(bucket.geminiIntervalRecommendation.currentIntervalMs)}`
      );
      sections.push(
        bucket.geminiIntervalRecommendation.insufficientData
          ? 'Recommended interval: insufficient data'
          : `Recommended interval: ${formatMs(bucket.geminiIntervalRecommendation.recommendedIntervalMs)}`
      );
    }

    if (bucket.geminiBackoffRecommendation) {
      sections.push(
        `Capacity retry sessions: ${bucket.geminiBackoffRecommendation.retrySessionCount}`
      );
      sections.push(
        `Hard retry rate: ${formatRate(bucket.geminiBackoffRecommendation.hardRetryRate)}`
      );
      sections.push(
        `Current backoff: ${formatDelayList(bucket.geminiBackoffRecommendation.currentRetryDelaysMs)}`
      );
      sections.push(
        bucket.geminiBackoffRecommendation.insufficientData
          ? 'Recommended backoff: insufficient data'
          : `Recommended backoff: ${formatDelayList(bucket.geminiBackoffRecommendation.recommendedRetryDelaysMs)}`
      );
    }

    sections.push('');
  }

  return sections.join('\n').trimEnd();
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseCliArgs(argv);
  const report = buildProviderDoctorReport({
    provider: parsed.provider
  });
  const output = parsed.json
    ? JSON.stringify(report, null, 2)
    : formatProviderDoctorReport(report);

  process.stdout.write(`${output}\n`);
}

function buildBucketReport(
  bucket: ProviderObservationBucket
): ProviderDoctorBucketReport {
  const timeoutRecommendation = buildBucketTimeoutRecommendation(bucket);
  const capacityErrorCount = bucket.observations.filter(
    (observation) => observation.capacityError
  ).length;
  const report: ProviderDoctorBucketReport = {
    bucketKey: bucket.key,
    callsite: bucket.callsite,
    capacityErrorCount,
    checkpoint: bucket.checkpoint,
    model: bucket.model,
    operation: bucket.operation,
    provider: bucket.provider,
    sampleCount: bucket.observations.length,
    timeoutRecommendation
  };

  if (bucket.provider === 'gemini' && bucket.operation === 'review-attempt') {
    const geminiPolicy = tryGetGeminiCurrentPolicy(
      bucket.model ?? 'gemini-3.5-flash-high'
    );
    if (geminiPolicy) {
      const sessions = buildGeminiReviewSessionSummaries(bucket.observations);
      report.geminiBackoffRecommendation =
        buildGeminiBackoffRecommendationSummary({
          currentRetryDelaysMs: geminiPolicy.retryDelaysMs,
          sessions
        });
      report.geminiIntervalRecommendation =
        buildGeminiIntervalRecommendationSummary({
          currentIntervalMs: geminiPolicy.targetIntervalMs,
          sessions
        });
      report.geminiSessionCount = sessions.length;
    }
  }

  return report;
}

function buildBucketTimeoutRecommendation(
  bucket: ProviderObservationBucket
): TimeoutRecommendationSummary | undefined {
  let currentTimeoutMs: number;

  if (bucket.provider === 'copilot') {
    if (!isCopilotPolicyOperation(bucket.operation)) {
      return undefined;
    }

    currentTimeoutMs = getCopilotPolicyTimeoutMs(bucket.operation);
  } else {
    if (!isGeminiPolicyOperation(bucket.operation)) {
      return undefined;
    }

    const geminiTimeoutMs = tryGetGeminiPolicyTimeoutMs({
      model: bucket.model,
      operation: bucket.operation
    });
    if (geminiTimeoutMs === undefined) {
      return undefined;
    }
    currentTimeoutMs = geminiTimeoutMs;
  }

  return buildTimeoutRecommendationSummary({
    currentTimeoutMs,
    observations: bucket.observations
  });
}

function tryGetGeminiCurrentPolicy(model: string) {
  try {
    return getGeminiCurrentPolicy(model);
  } catch {
    return undefined;
  }
}

function tryGetGeminiPolicyTimeoutMs(input: {
  model?: string;
  operation: GeminiPolicyOperation;
}): number | undefined {
  try {
    return getGeminiPolicyTimeoutMs(input);
  } catch {
    return undefined;
  }
}

function isCopilotPolicyOperation(
  operation: ProviderObservabilityOperation
): operation is CopilotPolicyOperation {
  return (
    operation === 'health-version' ||
    operation === 'health-probe' ||
    operation === 'reasoning-help' ||
    operation === 'review'
  );
}

function isGeminiPolicyOperation(
  operation: ProviderObservabilityOperation
): operation is GeminiPolicyOperation {
  return (
    operation === 'health-version' ||
    operation === 'health-probe' ||
    operation === 'review-attempt'
  );
}

function describeBucket(bucket: ProviderDoctorBucketReport): string {
  return [
    bucket.provider,
    bucket.callsite,
    bucket.checkpoint ?? 'no-checkpoint',
    bucket.operation,
    bucket.model ?? 'default'
  ].join(' / ');
}

function formatRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

function formatMs(value: number | null | undefined): string {
  if (typeof value !== 'number') {
    return 'n/a';
  }

  return `${value}ms`;
}

function formatDelayList(
  values: ReadonlyArray<number> | null | undefined
): string {
  if (!values || values.length === 0) {
    return 'n/a';
  }

  return values.map((value) => `${value}ms`).join(', ');
}

if (isMainModule(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
