import {
  cacheProviderHealth,
  getCachedProviderHealth,
  type ReviewProviderHealthResult
} from '../provider-health.ts';
import {
  createProviderTelemetryContext,
  recordProviderObservation,
  type ProviderTelemetryContext
} from '../provider-observability.ts';
import { GEMINI_HEALTH_TIMEOUT_MS } from '../provider-policies.ts';
import {
  acquireGeminiLock,
  getInterRequestDelayMs,
  getModelRateLimitPolicy,
  getRetryDelayMs,
  loadRateLimitState,
  recordRequestStart,
  sleep
} from '../rate-limit.ts';
import { runLocalCliCommand } from './local-cli.ts';

interface GeminiReviewInput {
  model: string;
  prompt: string;
  repoRoot?: string;
  telemetryContext?: ProviderTelemetryContext;
}

interface GeminiProviderDependencies {
  acquireLock?: typeof acquireGeminiLock;
  getInterRequestDelay?: typeof getInterRequestDelayMs;
  getModelPolicy?: typeof getModelRateLimitPolicy;
  getRetryDelay?: typeof getRetryDelayMs;
  loadRateLimitState?: typeof loadRateLimitState;
  now?: () => number;
  recordObservation?: typeof recordProviderObservation;
  recordRequestStart?: typeof recordRequestStart;
  runCommand?: typeof runLocalCliCommand;
  sleep?: typeof sleep;
}

const GEMINI_HEALTH_PROMPT = 'Reply with exactly OK.';
let geminiSessionCounter = 0;

export async function probeGeminiCliHealth(
  input: {
    model: string;
    repoRoot?: string;
    telemetryContext?: ProviderTelemetryContext;
  },
  dependencies: GeminiProviderDependencies = {}
): Promise<ReviewProviderHealthResult> {
  const now = dependencies.now ?? Date.now;
  const recordObservation =
    dependencies.recordObservation ?? recordProviderObservation;
  const runCommand = dependencies.runCommand ?? runLocalCliCommand;
  const repoRoot = input.repoRoot ?? process.cwd();
  const telemetryContext = createProviderTelemetryContext(
    input.telemetryContext
  );
  const cached = getCachedProviderHealth('gemini', input.model, repoRoot);
  if (cached) {
    return cached;
  }

  const checkedAtMs = now();
  const versionStartedAtMs = now();
  const versionResult = runCommand({
    command: 'gemini',
    windowsScriptName: 'gemini.ps1',
    args: ['--version'],
    cwd: repoRoot,
    timeoutMs: GEMINI_HEALTH_TIMEOUT_MS
  });
  recordObservation(
    {
      ...telemetryContext,
      configuredTimeoutMs: GEMINI_HEALTH_TIMEOUT_MS,
      durationMs: now() - versionStartedAtMs,
      errorCategory:
        !versionResult.error && versionResult.status === 0
          ? null
          : classifyGeminiErrorCategory(
              joinOutput(versionResult.stdout, versionResult.stderr),
              versionResult.error?.message
            ),
      model: input.model,
      operation: 'health-version',
      promptChars: 0,
      provider: 'gemini',
      success: !versionResult.error && versionResult.status === 0,
      timedOut: isGeminiTimedOut(versionResult)
    },
    repoRoot
  );

  if (versionResult.error || versionResult.status !== 0) {
    return cacheProviderHealth(
      'gemini',
      input.model,
      {
        available: false,
        checkedAtMs,
        reason: 'Gemini CLI is not installed or cannot be started locally.'
      },
      repoRoot
    );
  }

  try {
    const output = await runGeminiTextCommand(
      {
        model: input.model,
        operation: 'health-probe',
        prompt: GEMINI_HEALTH_PROMPT,
        repoRoot,
        telemetryContext,
        timeoutMs: GEMINI_HEALTH_TIMEOUT_MS
      },
      dependencies
    );

    return cacheProviderHealth(
      'gemini',
      input.model,
      {
        available: /^OK\b/i.test(output.trim()),
        checkedAtMs,
        reason: /^OK\b/i.test(output.trim())
          ? undefined
          : 'Gemini CLI probe returned an unexpected response.'
      },
      repoRoot
    );
  } catch (error) {
    return cacheProviderHealth(
      'gemini',
      input.model,
      {
        available: false,
        checkedAtMs,
        reason: error instanceof Error ? error.message : String(error)
      },
      repoRoot
    );
  }
}

export async function runGeminiReview(
  input: GeminiReviewInput,
  dependencies: GeminiProviderDependencies = {}
): Promise<string> {
  return runGeminiTextCommand(
    {
      ...input,
      operation: 'review-attempt'
    },
    dependencies
  );
}

export function isGeminiUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /\b(not authenticated|authenticate|login|sign in|api key|quota|429|MODEL_CAPACITY_EXHAUSTED|RESOURCE_EXHAUSTED|rateLimitExceeded|No capacity available|Requested entity was not found)\b/i.test(
    error.message
  );
}

function joinOutput(stdout?: string | null, stderr?: string | null): string {
  return [stdout, stderr].filter(Boolean).join('\n').trim();
}

function cleanGeminiOutput(output: string): string {
  return output
    .split(/\r?\n/)
    .map((line) =>
      line.replace(/^MCP issues detected\. Run \/mcp list for status\.?/i, '')
    )
    .filter((line) => line.trim().length > 0)
    .join('\n')
    .trim();
}

function classifyGeminiErrorCategory(
  output: string,
  errorMessage?: string
): string | null {
  const message = [output, errorMessage].filter(Boolean).join('\n').trim();

  if (!message) {
    return null;
  }

  if (/\b(timeout|timed out|ETIMEDOUT)\b/i.test(message)) {
    return 'timeout';
  }

  if (isGeminiCapacityError(message)) {
    return 'capacity';
  }

  if (
    /\b(not authenticated|authenticate|login|sign in|api key)\b/i.test(message)
  ) {
    return 'auth';
  }

  if (isGeminiModelNotFound(message)) {
    return 'model-not-found';
  }

  if (
    /\b(not installed|cannot be started locally|ENOENT|not recognized)\b/i.test(
      message
    )
  ) {
    return 'cli-unavailable';
  }

  if (/unexpected response/i.test(message)) {
    return 'unexpected-response';
  }

  return 'runtime-error';
}

function isGeminiCapacityError(output: string): boolean {
  return /\b429\b|MODEL_CAPACITY_EXHAUSTED|RESOURCE_EXHAUSTED|rateLimitExceeded|No capacity available/i.test(
    output
  );
}

function isGeminiModelNotFound(output: string): boolean {
  return /ModelNotFoundError|Requested entity was not found/i.test(output);
}

async function runGeminiTextCommand(
  input: GeminiReviewInput & {
    operation: 'health-probe' | 'review-attempt';
    timeoutMs?: number;
  },
  dependencies: GeminiProviderDependencies = {}
): Promise<string> {
  const acquireLock = dependencies.acquireLock ?? acquireGeminiLock;
  const getInterRequestDelay =
    dependencies.getInterRequestDelay ?? getInterRequestDelayMs;
  const getModelPolicy = dependencies.getModelPolicy ?? getModelRateLimitPolicy;
  const getRetryDelay = dependencies.getRetryDelay ?? getRetryDelayMs;
  const loadRateLimitStateFn =
    dependencies.loadRateLimitState ?? loadRateLimitState;
  const now = dependencies.now ?? Date.now;
  const recordObservation =
    dependencies.recordObservation ?? recordProviderObservation;
  const recordRequestStartFn =
    dependencies.recordRequestStart ?? recordRequestStart;
  const runCommand = dependencies.runCommand ?? runLocalCliCommand;
  const sleepFn = dependencies.sleep ?? sleep;
  const repoRoot = input.repoRoot ?? process.cwd();
  const telemetryContext = createProviderTelemetryContext(
    input.telemetryContext
  );
  const releaseLock = await acquireLock(repoRoot);

  try {
    const policy = getModelPolicy(input.model);
    const state = loadRateLimitStateFn(repoRoot);
    const sessionId = `${policy.model}-${process.pid}-${now()}-${nextGeminiSessionId()}`;
    const waitBeforeStartMs = getInterRequestDelay({
      model: policy.model,
      nowMs: now(),
      lastStartedAtMs: state.models[policy.model]?.lastStartedAtMs
    });

    if (waitBeforeStartMs > 0) {
      await sleepFn(waitBeforeStartMs);
    }

    for (
      let attempt = 0;
      attempt <= policy.retryDelaysMs.length;
      attempt += 1
    ) {
      const attemptStartedAtMs = now();
      recordRequestStartFn(policy.model, attemptStartedAtMs, repoRoot);

      const result = runCommand({
        command: 'gemini',
        windowsScriptName: 'gemini.ps1',
        args: [
          '--model',
          policy.model,
          '--approval-mode',
          'plan',
          '--output-format',
          'text',
          '--prompt',
          ' '
        ],
        cwd: repoRoot,
        input: input.prompt,
        timeoutMs: input.timeoutMs ?? policy.requestTimeoutMs
      });
      const durationMs = now() - attemptStartedAtMs;
      const output = cleanGeminiOutput(
        joinOutput(result.stdout, result.stderr)
      );
      const timedOut = isGeminiTimedOut(result, output);
      const capacityError = isGeminiCapacityError(output);
      const retryDelayMs =
        (timedOut || capacityError) && attempt < policy.retryDelaysMs.length
          ? getRetryDelay(policy.model, attempt)
          : undefined;
      const attemptSucceeded =
        !result.error &&
        result.status === 0 &&
        !capacityError &&
        !isGeminiModelNotFound(output) &&
        output.trim().length > 0;
      recordObservation(
        {
          ...telemetryContext,
          attempt,
          capacityError,
          configuredTimeoutMs: input.timeoutMs ?? policy.requestTimeoutMs,
          durationMs,
          errorCategory: attemptSucceeded
            ? null
            : output.trim().length === 0 && !result.error && result.status === 0
              ? 'empty-output'
              : classifyGeminiErrorCategory(output, result.error?.message),
          model: policy.model,
          operation: input.operation,
          promptChars: input.prompt.length,
          provider: 'gemini',
          retryDelayMs,
          sessionId,
          success: attemptSucceeded,
          timedOut,
          waitBeforeStartMs: attempt === 0 ? waitBeforeStartMs : undefined
        },
        repoRoot
      );

      if (timedOut) {
        if (retryDelayMs !== undefined) {
          await sleepFn(retryDelayMs);
          continue;
        }

        throw new Error(`Gemini review timed out for model ${policy.model}.`);
      }

      if (capacityError) {
        if (retryDelayMs !== undefined) {
          await sleepFn(retryDelayMs);
          continue;
        }

        throw new Error(output);
      }

      if (isGeminiModelNotFound(output)) {
        throw new Error(output);
      }

      if (result.error || result.status !== 0) {
        throw new Error(
          output || result.error?.message || 'Gemini review command failed.'
        );
      }

      if (!output.trim()) {
        throw new Error(
          `Gemini review returned no output for model ${policy.model}.`
        );
      }

      return output.trim();
    }

    throw new Error(`Gemini review failed for model ${policy.model}.`);
  } finally {
    releaseLock();
  }
}

function isGeminiTimedOut(
  result: ReturnType<typeof runLocalCliCommand>,
  output = ''
): boolean {
  return (
    result.error?.name === 'TimeoutError' ||
    result.signal === 'SIGTERM' ||
    ((Boolean(result.error) || result.status !== 0) &&
      /\b(timeout|timed out|ETIMEDOUT)\b/i.test(
        [output, result.error?.message].filter(Boolean).join('\n')
      ))
  );
}

function nextGeminiSessionId(): number {
  geminiSessionCounter += 1;
  return geminiSessionCounter;
}
