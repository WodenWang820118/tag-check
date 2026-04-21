import {
  cacheProviderHealth,
  getCachedProviderHealth,
  type ReviewProviderHealthResult
} from '../provider-health.ts';
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
}

const GEMINI_HEALTH_PROMPT = 'Reply with exactly OK.';
const GEMINI_HEALTH_TIMEOUT_MS = 45_000;

export async function probeGeminiCliHealth(input: {
  model: string;
  repoRoot?: string;
}): Promise<ReviewProviderHealthResult> {
  const repoRoot = input.repoRoot ?? process.cwd();
  const cached = getCachedProviderHealth('gemini', input.model, repoRoot);
  if (cached) {
    return cached;
  }

  const checkedAtMs = Date.now();
  const versionResult = runLocalCliCommand({
    command: 'gemini',
    windowsScriptName: 'gemini.ps1',
    args: ['--version'],
    cwd: repoRoot,
    timeoutMs: GEMINI_HEALTH_TIMEOUT_MS
  });

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
    const output = await runGeminiTextCommand({
      model: input.model,
      prompt: GEMINI_HEALTH_PROMPT,
      repoRoot,
      timeoutMs: GEMINI_HEALTH_TIMEOUT_MS
    });

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
  input: GeminiReviewInput
): Promise<string> {
  return runGeminiTextCommand(input);
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

function isGeminiCapacityError(output: string): boolean {
  return /\b429\b|MODEL_CAPACITY_EXHAUSTED|RESOURCE_EXHAUSTED|rateLimitExceeded|No capacity available/i.test(
    output
  );
}

function isGeminiModelNotFound(output: string): boolean {
  return /ModelNotFoundError|Requested entity was not found/i.test(output);
}

async function runGeminiTextCommand(
  input: GeminiReviewInput & { timeoutMs?: number }
): Promise<string> {
  const repoRoot = input.repoRoot ?? process.cwd();
  const releaseLock = await acquireGeminiLock(repoRoot);

  try {
    const policy = getModelRateLimitPolicy(input.model);
    const state = loadRateLimitState(repoRoot);
    const waitBeforeStartMs = getInterRequestDelayMs({
      model: policy.model,
      nowMs: Date.now(),
      lastStartedAtMs: state.models[policy.model]?.lastStartedAtMs
    });

    if (waitBeforeStartMs > 0) {
      await sleep(waitBeforeStartMs);
    }

    for (
      let attempt = 0;
      attempt <= policy.retryDelaysMs.length;
      attempt += 1
    ) {
      recordRequestStart(policy.model, Date.now(), repoRoot);

      const result = runLocalCliCommand({
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

      const output = cleanGeminiOutput(
        joinOutput(result.stdout, result.stderr)
      );

      if (
        result.error?.name === 'TimeoutError' ||
        result.signal === 'SIGTERM'
      ) {
        if (attempt < policy.retryDelaysMs.length) {
          await sleep(getRetryDelayMs(policy.model, attempt));
          continue;
        }

        throw new Error(`Gemini review timed out for model ${policy.model}.`);
      }

      if (isGeminiCapacityError(output)) {
        if (attempt < policy.retryDelaysMs.length) {
          await sleep(getRetryDelayMs(policy.model, attempt));
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
