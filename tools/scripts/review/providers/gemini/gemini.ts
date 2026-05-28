import { randomUUID } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';

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
  readAgyTranscriptOutput?: typeof readAgyTranscriptOutput;
  runCommand?: (input: LocalCliCommandInput) => LocalCliCommandResult;
  sleep?: typeof sleep;
}

type GoogleReviewCli = 'agy';

interface GoogleReviewCliCommand {
  args: string[];
  command: string;
  input?: string;
  logFilePath?: string;
  windowsScriptName?: string;
}

const GOOGLE_REVIEW_CLI_ENV = 'GX_LAW_PREP_REVIEW_GOOGLE_CLI';
const AGY_INLINE_PROMPT_MAX_CHARS =
  process.platform === 'win32' ? 6_000 : 20_000;

const GEMINI_HEALTH_PROMPT = 'Reply with exactly OK.';
const AGY_EMPTY_OUTPUT_MESSAGE =
  'Antigravity CLI returned no output. Ensure `agy --print` writes review text to stdout for non-interactive use, and that `~/.gemini/antigravity-cli/settings.json` selects "Gemini 3.5 Flash (High)".';
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

      if (isAcceptableGeminiHealthOutput(cli, output)) {
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
          ? `No Antigravity reviewer CLI is available. ${failures.join('; ')}`
          : 'No Antigravity reviewer CLI is configured.'
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

  return /\b(timeout|timed out|ETIMEDOUT|not authenticated|authenticate|login|sign in|api key|quota|429|MODEL_CAPACITY_EXHAUSTED|RESOURCE_EXHAUSTED|rateLimitExceeded|No capacity available|Requested entity was not found|no output|empty output)\b/i.test(
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

function isAcceptableGeminiHealthOutput(
  cli: GoogleReviewCli,
  output: string
): boolean {
  const trimmed = output.trim();

  if (/^OK\b/i.test(trimmed)) {
    return true;
  }

  return cli === 'agy' && trimmed.length > 0;
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
  const readAgyTranscriptOutputFn =
    dependencies.readAgyTranscriptOutput ?? readAgyTranscriptOutput;
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
        readAgyTranscriptOutput: readAgyTranscriptOutputFn,
        runCommand,
        timeoutMs: input.timeoutMs ?? policy.requestTimeoutMs,
        cwd: repoRoot
      });
      const result = commandResult.result;
      const durationMs = now() - attemptStartedAtMs;
      const reviewOutput = cleanGeminiOutput(
        commandResult.cli === 'agy'
          ? (result.stdout ?? '')
          : joinOutput(result.stdout, result.stderr)
      );
      const diagnosticOutput = cleanGeminiOutput(
        joinOutput(result.stdout, result.stderr)
      );
      const timedOut = isGeminiTimedOut(result, diagnosticOutput);
      const capacityError = isGeminiCapacityError(diagnosticOutput);
      const retryDelayMs =
        (timedOut || capacityError) && attempt < policy.retryDelaysMs.length
          ? getRetryDelay(policy.model, attempt)
          : undefined;
      const attemptSucceeded =
        !result.error &&
        result.status === 0 &&
        !capacityError &&
        !isGeminiModelNotFound(diagnosticOutput) &&
        reviewOutput.trim().length > 0;
      recordObservation(
        {
          ...telemetryContext,
          attempt,
          capacityError,
          configuredTimeoutMs: input.timeoutMs ?? policy.requestTimeoutMs,
          durationMs,
          errorCategory: attemptSucceeded
            ? null
            : reviewOutput.trim().length === 0 &&
                !result.error &&
                result.status === 0
              ? 'empty-output'
              : classifyGeminiErrorCategory(
                  diagnosticOutput,
                  result.error?.message
                ),
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

        throw new Error(
          `Antigravity review timed out for model ${policy.model}.`
        );
      }

      if (capacityError) {
        if (retryDelayMs !== undefined) {
          await sleepFn(retryDelayMs);
          continue;
        }

        throw new Error(diagnosticOutput);
      }

      if (isGeminiModelNotFound(diagnosticOutput)) {
        throw new Error(diagnosticOutput);
      }

      if (result.error || result.status !== 0) {
        throw new Error(
          diagnosticOutput ||
            result.error?.message ||
            'Antigravity review command failed.'
        );
      }

      if (!reviewOutput.trim()) {
        throw new Error(
          `${AGY_EMPTY_OUTPUT_MESSAGE} Logical review model: ${policy.model}.`
        );
      }

      return reviewOutput.trim();
    }

    throw new Error(`Antigravity review failed for model ${policy.model}.`);
  } finally {
    releaseLock();
  }
}

function getGoogleReviewCliCandidates(): GoogleReviewCli[] {
  const configured = process.env[GOOGLE_REVIEW_CLI_ENV]?.trim().toLowerCase();

  if (!configured) {
    return ['agy'];
  }

  if (configured === 'agy' || configured === 'antigravity') {
    return ['agy'];
  }

  if (
    configured === 'gemini' ||
    configured === 'legacy-fallback' ||
    configured === 'agy,gemini'
  ) {
    throw new Error(
      `Legacy Gemini CLI execution is retired. The environment variable ${GOOGLE_REVIEW_CLI_ENV} must be set to 'agy' or 'antigravity' (or left unset).`
    );
  }

  throw new Error(
    `Unsupported review CLI "${configured}". Legacy Gemini CLI is retired. Use 'agy' or 'antigravity'.`
  );
}

function buildGoogleReviewCliVersionCommand(
  cli: GoogleReviewCli
): GoogleReviewCliCommand {
  return {
    args: ['--version'],
    command: cli
  };
}

function buildGoogleReviewCliTextCommand(input: {
  cli: GoogleReviewCli;
  logFilePath?: string;
  prompt: string;
  timeoutMs: number;
}): GoogleReviewCliCommand {
  return {
    args: [
      ...(input.logFilePath ? ['--log-file', input.logFilePath] : []),
      '--print',
      input.prompt,
      '--print-timeout',
      formatAgyTimeout(input.timeoutMs)
    ],
    command: input.cli,
    logFilePath: input.logFilePath
  };
}

function runGoogleReviewCliTextCommand(input: {
  cliCandidates: GoogleReviewCli[];
  cwd: string;
  model: string;
  prompt: string;
  readAgyTranscriptOutput: typeof readAgyTranscriptOutput;
  runCommand: (input: LocalCliCommandInput) => LocalCliCommandResult;
  timeoutMs: number;
}): { cli: GoogleReviewCli; result: LocalCliCommandResult } {
  let lastResult: {
    cli: GoogleReviewCli;
    result: LocalCliCommandResult;
  } | null = null;

  for (const cli of input.cliCandidates) {
    const logFilePath = createAgyLogFilePath();
    const preparedPrompt = prepareAgyPrompt(input.prompt);
    try {
      const command = buildGoogleReviewCliTextCommand({
        cli,
        logFilePath,
        prompt: preparedPrompt.prompt,
        timeoutMs: input.timeoutMs
      });
      let result = input.runCommand({
        ...command,
        cwd: input.cwd,
        timeoutMs: input.timeoutMs
      });

      if (isEmptySuccessfulAgyResult(result)) {
        const transcriptOutput = input.readAgyTranscriptOutput({ logFilePath });

        if (transcriptOutput) {
          result = {
            ...result,
            stdout: transcriptOutput
          };
        }
      }

      lastResult = { cli, result };
      return lastResult;
    } finally {
      removeAgyTempFile(logFilePath);
      if (preparedPrompt.promptFilePath) {
        removeAgyTempFile(preparedPrompt.promptFilePath);
      }
    }
  }

  return (
    lastResult ?? {
      cli: 'agy',
      result: {
        error: new Error('No Antigravity reviewer CLI candidates configured.'),
        status: null,
        stderr: '',
        stdout: ''
      }
    }
  );
}

function isEmptySuccessfulAgyResult(result: LocalCliCommandResult): boolean {
  return (
    !result.error &&
    result.status === 0 &&
    (result.stdout ?? '').trim().length === 0
  );
}

function formatAgyTimeout(timeoutMs: number): string {
  return `${Math.max(1, Math.ceil(timeoutMs / 1000))}s`;
}

function createAgyLogFilePath(): string {
  return join(
    tmpdir(),
    `gx-law-prep-agy-${process.pid}-${Date.now()}-${randomUUID()}.log`
  );
}

function prepareAgyPrompt(prompt: string): {
  prompt: string;
  promptFilePath?: string;
} {
  if (prompt.length <= AGY_INLINE_PROMPT_MAX_CHARS) {
    return { prompt };
  }

  const promptFilePath = join(
    tmpdir(),
    `gx-law-prep-agy-prompt-${process.pid}-${Date.now()}-${randomUUID()}.md`
  );
  writeFileSync(promptFilePath, prompt, 'utf8');

  return {
    prompt: [
      'The review context is too large for a safe CLI argument.',
      `Read the UTF-8 Markdown file at ${promptFilePath}.`,
      'Review only that file content and do not infer files from other repositories.',
      'Return the checkpoint review findings and verdict.'
    ].join(' '),
    promptFilePath
  };
}

function removeAgyTempFile(path: string): void {
  try {
    rmSync(path, { force: true });
  } catch {
    // Best-effort cleanup only; temp retention must not break review routing.
  }
}

function readAgyTranscriptOutput(input: {
  logFilePath: string;
}): string | null {
  const conversationId = readAgyConversationId(input.logFilePath);

  if (!conversationId) {
    return null;
  }

  const transcriptPath = join(
    homedir(),
    '.gemini',
    'antigravity-cli',
    'brain',
    conversationId,
    '.system_generated',
    'logs',
    'transcript.jsonl'
  );

  if (!existsSync(transcriptPath)) {
    return null;
  }

  return extractCompletedAgyModelResponse(safeReadText(transcriptPath));
}

function readAgyConversationId(logFilePath: string): string | null {
  const logText = safeReadText(logFilePath);
  const match =
    /\bPrint mode: conversation=([0-9a-f-]{36})\b/i.exec(logText) ??
    /\bCreated conversation ([0-9a-f-]{36})\b/i.exec(logText);

  return match?.[1] ?? null;
}

function extractCompletedAgyModelResponse(jsonl: string): string | null {
  let output: string | null = null;

  for (const line of jsonl.split(/\r?\n/)) {
    if (!line.trim()) {
      continue;
    }

    try {
      const entry = JSON.parse(line) as Record<string, unknown>;
      const content = entry.content;
      const toolCalls = entry.tool_calls;

      if (
        entry.source === 'MODEL' &&
        entry.type === 'PLANNER_RESPONSE' &&
        entry.status === 'DONE' &&
        typeof content === 'string' &&
        content.trim().length > 0 &&
        (!Array.isArray(toolCalls) || toolCalls.length === 0)
      ) {
        output = content.trim();
      }
    } catch {
      continue;
    }
  }

  return output;
}

function safeReadText(path: string): string {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
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
