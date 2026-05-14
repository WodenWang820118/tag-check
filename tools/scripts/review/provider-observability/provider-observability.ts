import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

export type ProviderObservabilityProvider = 'copilot' | 'gemini';
export type ProviderTelemetryCallsite =
  | 'checkpoint-review'
  | 'hybrid-gpt-review'
  | 'unspecified';
export type ProviderTelemetryCheckpoint =
  | 'plan'
  | 'implementation'
  | 'test'
  | 'pre-merge';
export type ProviderObservabilityOperation =
  | 'health-version'
  | 'health-probe'
  | 'reasoning-help'
  | 'review'
  | 'review-attempt';

export interface ProviderTelemetryContext {
  callsite: ProviderTelemetryCallsite;
  checkpoint?: ProviderTelemetryCheckpoint;
}

export interface ProviderObservation {
  attempt?: number;
  callsite: ProviderTelemetryCallsite;
  capacityError?: boolean;
  checkpoint?: ProviderTelemetryCheckpoint;
  configuredTimeoutMs: number;
  durationMs: number;
  errorCategory: string | null;
  model?: string;
  operation: ProviderObservabilityOperation;
  promptChars: number;
  provider: ProviderObservabilityProvider;
  recordedAtMs: number;
  retryDelayMs?: number;
  sessionId?: string;
  success: boolean;
  timedOut: boolean;
  waitBeforeStartMs?: number;
}

export interface ProviderObservationBucket {
  callsite: ProviderTelemetryCallsite;
  checkpoint?: ProviderTelemetryCheckpoint;
  key: string;
  model?: string;
  observations: ProviderObservation[];
  operation: ProviderObservabilityOperation;
  provider: ProviderObservabilityProvider;
}

export interface ProviderObservabilityState {
  buckets: Record<string, ProviderObservationBucket>;
}

export interface TimeoutRecommendationSummary {
  currentTimeoutMs: number;
  insufficientData: boolean;
  p50DurationMs: number | null;
  p95DurationMs: number | null;
  recommendedTimeoutMs: number | null;
  sampleCount: number;
  successCount: number;
  timeoutCount: number;
  timeoutRate: number;
}

export interface GeminiReviewSessionSummary {
  attempts: ProviderObservation[];
  exhaustedRetries: boolean;
  finalAttempt: number;
  firstAttemptCapacityError: boolean;
  retryTriggeredByCapacity: boolean;
  sessionId: string;
  success: boolean;
}

export interface GeminiIntervalRecommendationSummary {
  currentIntervalMs: number;
  firstAttemptCapacityRate: number;
  insufficientData: boolean;
  recommendedIntervalMs: number | null;
  sessionCount: number;
}

export interface GeminiBackoffRecommendationSummary {
  currentRetryDelaysMs: number[];
  hardRetryRate: number;
  insufficientData: boolean;
  recommendedRetryDelaysMs: number[] | null;
  retrySessionCount: number;
}

export interface ProviderObservationInput
  extends Omit<ProviderObservation, 'recordedAtMs'> {
  recordedAtMs?: number;
}

const MAX_OBSERVATIONS_PER_BUCKET = 100;
const MIN_TIMEOUT_RECOMMENDATION_SAMPLES = 5;
const MIN_GEMINI_INTERVAL_RECOMMENDATION_SAMPLES = 10;
const MIN_GEMINI_BACKOFF_RECOMMENDATION_SAMPLES = 5;
const FIVE_SECONDS_MS = 5_000;
const OBSERVABILITY_LOCK_DIR = 'provider-observability.lock';
const OBSERVABILITY_LOCK_RETRY_DELAY_MS = 25;
const OBSERVABILITY_LOCK_TIMEOUT_MS = 2_000;
const OBSERVABILITY_LOCK_STALE_MS = 30_000;

export function createProviderTelemetryContext(
  input: Partial<ProviderTelemetryContext> = {},
): ProviderTelemetryContext {
  return {
    callsite: input.callsite ?? 'unspecified',
    checkpoint: input.checkpoint,
  };
}

export function createProviderObservationBucketKey(input: {
  callsite: ProviderTelemetryCallsite;
  checkpoint?: ProviderTelemetryCheckpoint;
  model?: string;
  operation: ProviderObservabilityOperation;
  provider: ProviderObservabilityProvider;
}): string {
  return [
    input.provider,
    input.callsite,
    input.checkpoint ?? 'none',
    input.operation,
    input.model ?? 'default',
  ].join(':');
}

export function getProviderObservabilityStatePath(
  repoRoot = process.cwd(),
): string {
  return path.join(
    repoRoot,
    '.cache',
    'reviews',
    'provider-observability-state.json',
  );
}

export function loadProviderObservabilityState(
  repoRoot = process.cwd(),
): ProviderObservabilityState {
  const statePath = getProviderObservabilityStatePath(repoRoot);

  if (!existsSync(statePath)) {
    return { buckets: {} };
  }

  try {
    return JSON.parse(
      readFileSync(statePath, 'utf8'),
    ) as ProviderObservabilityState;
  } catch {
    return { buckets: {} };
  }
}

export function saveProviderObservabilityState(
  state: ProviderObservabilityState,
  repoRoot = process.cwd(),
): void {
  const statePath = getProviderObservabilityStatePath(repoRoot);
  mkdirSync(path.dirname(statePath), { recursive: true });
  writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
}

export function recordProviderObservation(
  input: ProviderObservationInput,
  repoRoot = process.cwd(),
): ProviderObservation {
  return withProviderObservabilityLock(repoRoot, () => {
    const state = loadProviderObservabilityState(repoRoot);
    const observation = normalizeObservation(input);
    const key = createProviderObservationBucketKey(observation);
    const bucket = state.buckets[key] ?? {
      callsite: observation.callsite,
      checkpoint: observation.checkpoint,
      key,
      model: observation.model,
      observations: [],
      operation: observation.operation,
      provider: observation.provider,
    };

    bucket.observations = [...bucket.observations, observation]
      .sort((left, right) => left.recordedAtMs - right.recordedAtMs)
      .slice(-MAX_OBSERVATIONS_PER_BUCKET);
    state.buckets[key] = bucket;
    saveProviderObservabilityState(state, repoRoot);

    return observation;
  });
}

export function listProviderObservationBuckets(
  input: {
    provider?: ProviderObservabilityProvider;
    repoRoot?: string;
  } = {},
): ProviderObservationBucket[] {
  const state = loadProviderObservabilityState(input.repoRoot);
  return Object.values(state.buckets)
    .filter((bucket) => !input.provider || bucket.provider === input.provider)
    .sort(compareProviderObservationBuckets);
}

export function buildTimeoutRecommendationSummary(input: {
  currentTimeoutMs: number;
  observations: ReadonlyArray<ProviderObservation>;
}): TimeoutRecommendationSummary {
  const successfulDurations = input.observations
    .filter((observation) => observation.success)
    .map((observation) => observation.durationMs)
    .sort((left, right) => left - right);
  const timeoutCount = input.observations.filter(
    (observation) => observation.timedOut,
  ).length;

  if (successfulDurations.length < MIN_TIMEOUT_RECOMMENDATION_SAMPLES) {
    return {
      currentTimeoutMs: input.currentTimeoutMs,
      insufficientData: true,
      p50DurationMs: percentile(successfulDurations, 0.5),
      p95DurationMs: percentile(successfulDurations, 0.95),
      recommendedTimeoutMs: null,
      sampleCount: input.observations.length,
      successCount: successfulDurations.length,
      timeoutCount,
      timeoutRate: getRate(timeoutCount, input.observations.length),
    };
  }

  const p95DurationMs = percentile(successfulDurations, 0.95) ?? 0;
  const currentTimeoutMs = input.currentTimeoutMs;
  const recommendedTimeoutMs = roundUpToNearestFiveSeconds(
    clamp(p95DurationMs * 1.2, currentTimeoutMs * 0.5, currentTimeoutMs * 2),
  );

  return {
    currentTimeoutMs,
    insufficientData: false,
    p50DurationMs: percentile(successfulDurations, 0.5),
    p95DurationMs,
    recommendedTimeoutMs,
    sampleCount: input.observations.length,
    successCount: successfulDurations.length,
    timeoutCount,
    timeoutRate: getRate(timeoutCount, input.observations.length),
  };
}

export function buildGeminiReviewSessionSummaries(
  observations: ReadonlyArray<ProviderObservation>,
): GeminiReviewSessionSummary[] {
  const sessions = new Map<string, ProviderObservation[]>();

  for (const observation of observations) {
    if (observation.operation !== 'review-attempt' || !observation.sessionId) {
      continue;
    }

    const sessionObservations = sessions.get(observation.sessionId) ?? [];
    sessionObservations.push(observation);
    sessions.set(observation.sessionId, sessionObservations);
  }

  return [...sessions.entries()]
    .map(([sessionId, attempts]) => {
      const sortedAttempts = [...attempts].sort(
        (left, right) => left.recordedAtMs - right.recordedAtMs,
      );
      const lastAttempt = sortedAttempts.at(-1);
      const firstAttempt = sortedAttempts[0];
      const retryTriggeredByCapacity =
        sortedAttempts.length > 1 &&
        sortedAttempts.some((attempt) => attempt.capacityError);

      return {
        attempts: sortedAttempts,
        exhaustedRetries: Boolean(lastAttempt && !lastAttempt.success),
        finalAttempt: lastAttempt?.attempt ?? sortedAttempts.length - 1,
        firstAttemptCapacityError: firstAttempt?.capacityError === true,
        retryTriggeredByCapacity,
        sessionId,
        success: lastAttempt?.success === true,
      };
    })
    .sort((left, right) => left.sessionId.localeCompare(right.sessionId));
}

export function buildGeminiIntervalRecommendationSummary(input: {
  currentIntervalMs: number;
  sessions: ReadonlyArray<GeminiReviewSessionSummary>;
}): GeminiIntervalRecommendationSummary {
  const sessionCount = input.sessions.length;
  const firstAttemptCapacityCount = input.sessions.filter(
    (session) => session.firstAttemptCapacityError,
  ).length;
  const firstAttemptCapacityRate = getRate(
    firstAttemptCapacityCount,
    sessionCount,
  );

  if (sessionCount < MIN_GEMINI_INTERVAL_RECOMMENDATION_SAMPLES) {
    return {
      currentIntervalMs: input.currentIntervalMs,
      firstAttemptCapacityRate,
      insufficientData: true,
      recommendedIntervalMs: null,
      sessionCount,
    };
  }

  const incrementMs =
    firstAttemptCapacityRate >= 0.2
      ? 10_000
      : firstAttemptCapacityRate >= 0.1
        ? 5_000
        : 0;

  return {
    currentIntervalMs: input.currentIntervalMs,
    firstAttemptCapacityRate,
    insufficientData: false,
    recommendedIntervalMs: input.currentIntervalMs + incrementMs,
    sessionCount,
  };
}

export function buildGeminiBackoffRecommendationSummary(input: {
  currentRetryDelaysMs: ReadonlyArray<number>;
  sessions: ReadonlyArray<GeminiReviewSessionSummary>;
}): GeminiBackoffRecommendationSummary {
  const retrySessions = input.sessions.filter(
    (session) => session.retryTriggeredByCapacity,
  );
  const retrySessionCount = retrySessions.length;
  const hardRetryCount = retrySessions.filter(
    (session) => session.finalAttempt >= 2 || session.exhaustedRetries,
  ).length;
  const hardRetryRate = getRate(hardRetryCount, retrySessionCount);

  if (retrySessionCount < MIN_GEMINI_BACKOFF_RECOMMENDATION_SAMPLES) {
    return {
      currentRetryDelaysMs: [...input.currentRetryDelaysMs],
      hardRetryRate,
      insufficientData: true,
      recommendedRetryDelaysMs: null,
      retrySessionCount,
    };
  }

  const multiplier =
    hardRetryRate >= 0.5 ? 1.5 : hardRetryRate >= 0.25 ? 1.25 : 1;

  return {
    currentRetryDelaysMs: [...input.currentRetryDelaysMs],
    hardRetryRate,
    insufficientData: false,
    recommendedRetryDelaysMs: input.currentRetryDelaysMs.map((delayMs) =>
      roundToNearestFiveSeconds(delayMs * multiplier),
    ),
    retrySessionCount,
  };
}

function normalizeObservation(
  input: ProviderObservationInput,
): ProviderObservation {
  return {
    ...input,
    callsite: input.callsite,
    checkpoint: input.checkpoint,
    errorCategory: input.errorCategory ?? null,
    model: input.model,
    // Never store raw prompt text in observability state. Persist prompt length only.
    promptChars: input.promptChars,
    recordedAtMs: input.recordedAtMs ?? Date.now(),
  };
}

function compareProviderObservationBuckets(
  left: ProviderObservationBucket,
  right: ProviderObservationBucket,
): number {
  return left.key.localeCompare(right.key);
}

function percentile(
  values: ReadonlyArray<number>,
  value: number,
): number | null {
  if (values.length === 0) {
    return null;
  }

  const index = Math.max(0, Math.ceil(values.length * value) - 1);
  return values[Math.min(index, values.length - 1)] ?? null;
}

function getRate(count: number, total: number): number {
  if (total <= 0) {
    return 0;
  }

  return count / total;
}

function roundUpToNearestFiveSeconds(value: number): number {
  return Math.ceil(value / FIVE_SECONDS_MS) * FIVE_SECONDS_MS;
}

function roundToNearestFiveSeconds(value: number): number {
  return Math.round(value / FIVE_SECONDS_MS) * FIVE_SECONDS_MS;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function withProviderObservabilityLock<T>(
  repoRoot: string,
  operation: () => T,
): T {
  const lockPath = path.join(
    repoRoot,
    '.cache',
    'reviews',
    OBSERVABILITY_LOCK_DIR,
  );
  mkdirSync(path.dirname(lockPath), { recursive: true });
  const startedAtMs = Date.now();

  while (true) {
    try {
      mkdirSync(lockPath);
      break;
    } catch (error) {
      const err = error as NodeJS.ErrnoException;
      if (err.code !== 'EEXIST') {
        throw error;
      }

      if (isStaleLock(lockPath)) {
        rmSync(lockPath, { force: true, recursive: true });
        continue;
      }

      if (Date.now() - startedAtMs >= OBSERVABILITY_LOCK_TIMEOUT_MS) {
        throw new Error(
          'Timed out while waiting for the provider observability cache lock.',
        );
      }

      sleepSync(OBSERVABILITY_LOCK_RETRY_DELAY_MS);
    }
  }

  try {
    return operation();
  } finally {
    rmSync(lockPath, { force: true, recursive: true });
  }
}

function isStaleLock(lockPath: string): boolean {
  try {
    return (
      Date.now() - statSync(lockPath).mtimeMs > OBSERVABILITY_LOCK_STALE_MS
    );
  } catch {
    return false;
  }
}

function sleepSync(durationMs: number): void {
  if (durationMs <= 0) {
    return;
  }

  if (typeof SharedArrayBuffer === 'function') {
    const buffer = new SharedArrayBuffer(4);
    const view = new Int32Array(buffer);
    Atomics.wait(view, 0, 0, durationMs);
    return;
  }

  const endAtMs = Date.now() + durationMs;
  while (Date.now() < endAtMs) {
    // Busy-wait fallback for runtimes without SharedArrayBuffer support.
  }
}
