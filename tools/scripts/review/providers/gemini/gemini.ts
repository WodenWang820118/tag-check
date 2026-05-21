import {
  cacheProviderHealth,
  getCachedProviderHealth,
  type ReviewProviderHealthResult
} from '../../provider-health/provider-health.ts';
import {
  createProviderTelemetryContext,
  recordProviderObservation,
  type ProviderObservationInput,
  type ProviderTelemetryContext
} from '../../provider-observability/provider-observability.ts';
import { GEMINI_HEALTH_TIMEOUT_MS } from '../../provider-policies/provider-policies.ts';
import {
  acquireGeminiLock,
  getInterRequestDelayMs,
  getModelRateLimitPolicy,
  getRetryDelayMs,
  loadRateLimitState,
  recordRequestStart,
  sleep
} from '../../rate-limit/rate-limit.ts';
import {
  runLocalCliCommand,
  type LocalCliCommandInput,
  type LocalCliCommandResult
} from '../local-cli/local-cli.ts';

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
  recordObservation?: (
    input: ProviderObservationInput,
    repoRoot?: string
  ) => unknown;
  recordRequestStart?: typeof recordRequestStart;
  runCommand?: (input: LocalCliCommandInput) => LocalCliCommandResult;
  sleep?: typeof sleep;
}

type GoogleReviewCli = 'agy' | 'gemini';

interface GoogleReviewCliCommand {
  args: string[];
  command: string;
  input?: string;
  windowsScriptName?: string;
}

const GOOGLE_REVIEW_CLI_ENV = 'GX_LAW_PREP_REVIEW_GOOGLE_CLI';
const AGY_REVIEW_TIMEOUT_MS = 30_000;

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
  const failures: string[] = [];

  for (const cli of getGoogleReviewCliCandidates()) {
    const versionStartedAtMs = now();
    const versionResult = runCommand({
      ...buildGoogleReviewCliVersionCommand(cli),
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
      failures.push(
        `${cli}: ${joinOutput(versionResult.stdout, versionResult.stderr) || versionResult.error?.message || 'not installed'}`
      );
      continue;
    }

    try {
      const output = await runGeminiTextCommand(
        {
          cliCandidates: [cli],
          model: input.model,
          operation: 'health-probe',
          prompt: GEMINI_HEALTH_PROMPT,
          repoRoot,
          telemetryContext,
          timeoutMs: GEMINI_HEALTH_TIMEOUT_MS
        },
        dependencies
      );

      if (/^OK\b/i.test(output.trim())) {
        return cacheProviderHealth(
          'gemini',
          input.model,
          {
            available: true,
            checkedAtMs
          },
          repoRoot
        );
      }

      failures.push(`${cli}: unexpected probe response`);
    } catch (error) {
      failures.push(
        `${cli}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  return cacheProviderHealth(
    'gemini',
    input.model,
    {
      available: false,
      checkedAtMs,
      reason:
        failures.length > 0
          ? `No Antigravity/Gemini reviewer CLI is available. ${failures.join('; ')}`
          : 'No Antigravity/Gemini reviewer CLI is configured.'
    },
    repoRoot
  );
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

  return /\b(timeout|timed out|ETIMEDOUT|not authenticated|authenticate|login|sign in|api key|quota|429|MODEL_CAPACITY_EXHAUSTED|RESOURCE_EXHAUSTED|rateLimitExceeded|No capacity available|Requested entity was not found)\b/i.test(
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
    cliCandidates?: GoogleReviewCli[];
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

      const commandResult = runGoogleReviewCliTextCommand({
        cliCandidates: input.cliCandidates ?? getGoogleReviewCliCandidates(),
        model: policy.model,
        prompt: input.prompt,
        runCommand,
        timeoutMs: input.timeoutMs ?? policy.requestTimeoutMs,
        cwd: repoRoot
      });
      const result = commandResult.result;
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

function getGoogleReviewCliCandidates(): GoogleReviewCli[] {
  const configured = process.env[GOOGLE_REVIEW_CLI_ENV]?.trim().toLowerCase();

  if (configured === 'gemini') {
    return ['gemini'];
  }

  if (configured === 'agy' || configured === 'antigravity') {
    return ['agy', 'gemini'];
  }

  return ['agy', 'gemini'];
}

function buildGoogleReviewCliVersionCommand(
  cli: GoogleReviewCli
): GoogleReviewCliCommand {
  if (cli === 'agy') {
    return {
      args: ['--version'],
      command: 'agy'
    };
  }

  return {
    args: ['--version'],
    command: 'gemini',
    windowsScriptName: 'gemini.ps1'
  };
}

function buildGoogleReviewCliTextCommand(input: {
  cli: GoogleReviewCli;
  model: string;
  prompt: string;
  timeoutMs: number;
}): GoogleReviewCliCommand {
  if (input.cli === 'agy') {
    return {
      args: [
        '--print',
        '--print-timeout',
        formatAgyTimeout(input.timeoutMs),
        input.prompt
      ],
      command: 'agy'
    };
  }

  return {
    args: [
      '--model',
      input.model,
      '--approval-mode',
      'plan',
      '--output-format',
      'text',
      '--prompt',
      ' '
    ],
    command: 'gemini',
    input: input.prompt,
    windowsScriptName: 'gemini.ps1'
  };
}

function runGoogleReviewCliTextCommand(input: {
  cliCandidates: GoogleReviewCli[];
  cwd: string;
  model: string;
  prompt: string;
  runCommand: (input: LocalCliCommandInput) => LocalCliCommandResult;
  timeoutMs: number;
}): { cli: GoogleReviewCli; result: LocalCliCommandResult } {
  let lastResult: {
    cli: GoogleReviewCli;
    result: LocalCliCommandResult;
  } | null = null;

  for (const cli of input.cliCandidates) {
    const command = buildGoogleReviewCliTextCommand({
      cli,
      model: input.model,
      prompt: input.prompt,
      timeoutMs:
        cli === 'agy'
          ? Math.min(input.timeoutMs, AGY_REVIEW_TIMEOUT_MS)
          : input.timeoutMs
    });
    const result = input.runCommand({
      ...command,
      cwd: input.cwd,
      timeoutMs:
        cli === 'agy'
          ? Math.min(input.timeoutMs, AGY_REVIEW_TIMEOUT_MS)
          : input.timeoutMs
    });
    lastResult = { cli, result };
    const output = joinOutput(result.stdout, result.stderr);

    if (!isFallbackEligibleGoogleCliFailure(cli, result, output)) {
      return lastResult;
    }
  }

  return (
    lastResult ?? {
      cli: 'gemini',
      result: {
        error: new Error(
          'No Antigravity/Gemini reviewer CLI candidates configured.'
        ),
        status: null,
        stderr: '',
        stdout: ''
      }
    }
  );
}

function isFallbackEligibleGoogleCliFailure(
  cli: GoogleReviewCli,
  result: LocalCliCommandResult,
  output: string
): boolean {
  if (cli !== 'agy') {
    return false;
  }

  if (!result.error && result.status === 0 && output.trim().length > 0) {
    return false;
  }

  return (
    /\b(timeout|timed out|ETIMEDOUT|not authenticated|authenticate|login|sign in|api key|not installed|cannot be started locally|ENOENT|not recognized)\b/i.test(
      [output, result.error?.message].filter(Boolean).join('\n')
    ) || output.trim().length === 0
  );
}

function formatAgyTimeout(timeoutMs: number): string {
  return `${Math.max(1, Math.ceil(timeoutMs / 1000))}s`;
}

function isGeminiTimedOut(result: LocalCliCommandResult, output = ''): boolean {
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
