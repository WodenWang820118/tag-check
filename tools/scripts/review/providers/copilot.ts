import { resolve } from 'node:path';

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
import {
  getCopilotPolicyTimeoutMs,
  COPILOT_HEALTH_TIMEOUT_MS,
  COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS,
  COPILOT_REVIEW_TIMEOUT_MS
} from '../provider-policies.ts';
import { runLocalCliCommand } from './local-cli.ts';

interface CopilotReviewInput {
  model?: string;
  prompt: string;
  repoRoot?: string;
  telemetryContext?: ProviderTelemetryContext;
}

interface CopilotProviderDependencies {
  now?: () => number;
  recordObservation?: typeof recordProviderObservation;
  reasoningEffortSupportCache?: Map<
    string,
    '--effort' | '--reasoning-effort' | null
  >;
  runCommand?: typeof runLocalCliCommand;
}

const COPILOT_HEALTH_PROMPT = 'Reply with exactly OK.';
const COPILOT_REASONING_EFFORT_LEVEL = 'high';
const DEFAULT_REASONING_EFFORT_SUPPORT_CACHE = new Map<
  string,
  '--effort' | '--reasoning-effort' | null
>();

export function isCopilotUnavailableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /\b(quota|premium requests|billing|not authenticated|authenticate|login|sign in|required|subscription|entitlement|rate limit|unavailable)\b/i.test(
    error.message
  );
}

export function probeCopilotCliHealth(
  input: {
    model?: string;
    repoRoot?: string;
    telemetryContext?: ProviderTelemetryContext;
  } = {},
  dependencies: CopilotProviderDependencies = {}
): ReviewProviderHealthResult {
  const now = dependencies.now ?? Date.now;
  const recordObservation =
    dependencies.recordObservation ?? recordProviderObservation;
  const runCommand = dependencies.runCommand ?? runLocalCliCommand;
  const repoRoot = input.repoRoot ?? process.cwd();
  const telemetryContext = createProviderTelemetryContext(
    input.telemetryContext
  );
  const cached = getCachedProviderHealth('copilot', input.model, repoRoot);
  if (cached) {
    return cached;
  }

  const checkedAtMs = now();
  const versionStartedAtMs = now();
  const versionResult = runCommand({
    command: 'copilot',
    windowsScriptName: 'copilot.ps1',
    args: ['--version'],
    cwd: repoRoot,
    timeoutMs: COPILOT_HEALTH_TIMEOUT_MS
  });
  recordObservation(
    {
      ...telemetryContext,
      configuredTimeoutMs: getCopilotPolicyTimeoutMs('health-version'),
      durationMs: now() - versionStartedAtMs,
      errorCategory:
        !versionResult.error && versionResult.status === 0
          ? null
          : classifyCopilotErrorCategory(
              joinOutput(versionResult.stdout, versionResult.stderr),
              versionResult.error?.message
            ),
      model: input.model,
      operation: 'health-version',
      promptChars: 0,
      provider: 'copilot',
      success: !versionResult.error && versionResult.status === 0,
      timedOut: isCopilotTimedOut(versionResult)
    },
    repoRoot
  );

  if (versionResult.error || versionResult.status !== 0) {
    return cacheProviderHealth(
      'copilot',
      input.model,
      {
        available: false,
        checkedAtMs,
        reason: 'Copilot CLI is not installed or cannot be started locally.'
      },
      repoRoot
    );
  }

  const probeStartedAtMs = now();
  const probeResult = runCommand({
    command: 'copilot',
    windowsScriptName: 'copilot.ps1',
    args: buildCopilotCommandArgs({
      disableBuiltinMcps: true,
      disableCustomInstructions: true,
      model: input.model,
      prompt: COPILOT_HEALTH_PROMPT
    }),
    cwd: repoRoot,
    timeoutMs: COPILOT_HEALTH_TIMEOUT_MS
  });

  const output = stripCopilotFooter(
    joinOutput(probeResult.stdout, probeResult.stderr)
  );
  const probeSucceeded =
    !probeResult.error &&
    probeResult.status === 0 &&
    /^OK\b/i.test(output.trim());
  recordObservation(
    {
      ...telemetryContext,
      configuredTimeoutMs: getCopilotPolicyTimeoutMs('health-probe'),
      durationMs: now() - probeStartedAtMs,
      errorCategory: probeSucceeded
        ? null
        : output.trim().length > 0 && probeResult.status === 0
          ? 'unexpected-response'
          : classifyCopilotErrorCategory(output, probeResult.error?.message),
      model: input.model,
      operation: 'health-probe',
      promptChars: COPILOT_HEALTH_PROMPT.length,
      provider: 'copilot',
      success: probeSucceeded,
      timedOut: isCopilotTimedOut(probeResult, output)
    },
    repoRoot
  );

  if (!probeResult.error && probeResult.status === 0) {
    if (/^OK\b/i.test(output.trim())) {
      return cacheProviderHealth(
        'copilot',
        input.model,
        {
          available: true,
          checkedAtMs
        },
        repoRoot
      );
    }

    return cacheProviderHealth(
      'copilot',
      input.model,
      {
        available: false,
        checkedAtMs,
        reason: 'Copilot CLI probe returned an unexpected response.'
      },
      repoRoot
    );
  }

  return cacheProviderHealth(
    'copilot',
    input.model,
    {
      available: false,
      checkedAtMs,
      reason: classifyCopilotProbeFailure(output, probeResult.error?.message)
    },
    repoRoot
  );
}

export function runCopilotReview(
  input: CopilotReviewInput,
  dependencies: CopilotProviderDependencies = {}
): string {
  const now = dependencies.now ?? Date.now;
  const recordObservation =
    dependencies.recordObservation ?? recordProviderObservation;
  const runCommand = dependencies.runCommand ?? runLocalCliCommand;
  const repoRoot = input.repoRoot ?? process.cwd();
  const telemetryContext = createProviderTelemetryContext(
    input.telemetryContext
  );
  const reasoningEffortSupportCache =
    dependencies.reasoningEffortSupportCache ??
    DEFAULT_REASONING_EFFORT_SUPPORT_CACHE;
  const reviewArgs = buildCopilotReviewCommandArgs(
    {
      model: input.model,
      prompt: input.prompt,
      repoRoot,
      telemetryContext
    },
    {
      now,
      recordObservation,
      reasoningEffortSupportCache,
      runCommand
    }
  );
  const reviewStartedAtMs = now();
  let result = runCommand({
    command: 'copilot',
    windowsScriptName: 'copilot.ps1',
    args: reviewArgs,
    cwd: repoRoot,
    timeoutMs: COPILOT_REVIEW_TIMEOUT_MS
  });
  let output = stripCopilotFooter(joinOutput(result.stdout, result.stderr));

  if (
    (result.error || result.status !== 0) &&
    reviewArgs.some(
      (argument) => argument === '--reasoning-effort' || argument === '--effort'
    ) &&
    isUnsupportedReasoningEffortError(output || result.error?.message)
  ) {
    recordObservation(
      {
        ...telemetryContext,
        configuredTimeoutMs: getCopilotPolicyTimeoutMs('review'),
        durationMs: now() - reviewStartedAtMs,
        errorCategory: classifyCopilotErrorCategory(
          output,
          result.error?.message
        ),
        model: input.model,
        operation: 'review',
        promptChars: input.prompt.length,
        provider: 'copilot',
        success: false,
        timedOut: isCopilotTimedOut(result, output)
      },
      repoRoot
    );
    reasoningEffortSupportCache.set(resolve(repoRoot), null);
    const retryStartedAtMs = now();
    result = runCommand({
      command: 'copilot',
      windowsScriptName: 'copilot.ps1',
      args: buildCopilotCommandArgs({
        experimental: true,
        model: input.model,
        prompt: input.prompt
      }),
      cwd: repoRoot,
      timeoutMs: COPILOT_REVIEW_TIMEOUT_MS
    });
    output = stripCopilotFooter(joinOutput(result.stdout, result.stderr));
    const reviewDurationMs = now() - retryStartedAtMs;
    recordObservation(
      {
        ...telemetryContext,
        configuredTimeoutMs: getCopilotPolicyTimeoutMs('review'),
        durationMs: reviewDurationMs,
        errorCategory:
          !result.error && result.status === 0 && output.trim().length > 0
            ? null
            : output.trim().length === 0 && !result.error && result.status === 0
              ? 'empty-output'
              : classifyCopilotErrorCategory(output, result.error?.message),
        model: input.model,
        operation: 'review',
        promptChars: input.prompt.length,
        provider: 'copilot',
        success:
          !result.error && result.status === 0 && output.trim().length > 0,
        timedOut: isCopilotTimedOut(result, output)
      },
      repoRoot
    );

    if (result.error || result.status !== 0) {
      throw new Error(
        output || result.error?.message || 'Copilot review command failed.'
      );
    }

    if (!output.trim()) {
      throw new Error('Copilot review returned no output.');
    }

    return output.trim();
  }

  const reviewSucceeded =
    !result.error && result.status === 0 && output.trim().length > 0;
  recordObservation(
    {
      ...telemetryContext,
      configuredTimeoutMs: getCopilotPolicyTimeoutMs('review'),
      durationMs: now() - reviewStartedAtMs,
      errorCategory: reviewSucceeded
        ? null
        : output.trim().length === 0 && !result.error && result.status === 0
          ? 'empty-output'
          : classifyCopilotErrorCategory(output, result.error?.message),
      model: input.model,
      operation: 'review',
      promptChars: input.prompt.length,
      provider: 'copilot',
      success: reviewSucceeded,
      timedOut: isCopilotTimedOut(result, output)
    },
    repoRoot
  );

  if (result.error || result.status !== 0) {
    throw new Error(
      output || result.error?.message || 'Copilot review command failed.'
    );
  }

  if (!output.trim()) {
    throw new Error('Copilot review returned no output.');
  }

  return output.trim();
}

export function buildCopilotReviewCommandArgs(
  input: CopilotReviewInput,
  dependencies: CopilotProviderDependencies = {}
): string[] {
  const args = buildCopilotCommandArgs({
    experimental: true,
    model: input.model,
    prompt: input.prompt
  });
  const now = dependencies.now ?? Date.now;
  const recordObservation =
    dependencies.recordObservation ?? recordProviderObservation;
  const repoRoot = input.repoRoot ?? process.cwd();
  const telemetryContext = createProviderTelemetryContext(
    input.telemetryContext
  );
  const reasoningEffortSupportCache =
    dependencies.reasoningEffortSupportCache ??
    DEFAULT_REASONING_EFFORT_SUPPORT_CACHE;
  const runCommand = dependencies.runCommand ?? runLocalCliCommand;

  const supportedFlag = supportsCopilotReasoningEffort({
    model: input.model,
    now,
    recordObservation,
    reasoningEffortSupportCache,
    repoRoot,
    telemetryContext,
    runCommand
  });

  if (supportedFlag) {
    args.push(supportedFlag, COPILOT_REASONING_EFFORT_LEVEL);
  }

  return args;
}

export function buildCopilotCommandArgs(input: {
  disableBuiltinMcps?: boolean;
  disableCustomInstructions?: boolean;
  experimental?: boolean;
  model?: string;
  prompt: string;
}): string[] {
  const args = [
    '-p',
    input.prompt,
    '--output-format',
    'text',
    '--silent',
    '--mode',
    'plan'
  ];

  if (input.experimental) {
    args.unshift('--experimental');
  }

  if (input.disableCustomInstructions) {
    args.push('--no-custom-instructions');
  }

  if (input.disableBuiltinMcps) {
    args.push('--disable-builtin-mcps');
  }

  if (input.model) {
    args.push('--model', input.model);
  }

  return args;
}

function supportsCopilotReasoningEffort(input: {
  model?: string;
  now: () => number;
  recordObservation: typeof recordProviderObservation;
  reasoningEffortSupportCache: Map<
    string,
    '--effort' | '--reasoning-effort' | null
  >;
  repoRoot: string;
  telemetryContext: ProviderTelemetryContext;
  runCommand: typeof runLocalCliCommand;
}): '--effort' | '--reasoning-effort' | null {
  const cacheKey = resolve(input.repoRoot);
  const cached = input.reasoningEffortSupportCache.get(cacheKey);
  if (typeof cached === 'string' || cached === null) {
    return cached;
  }

  const startedAtMs = input.now();
  const helpResult = input.runCommand({
    command: 'copilot',
    windowsScriptName: 'copilot.ps1',
    args: ['--help'],
    cwd: input.repoRoot,
    timeoutMs: COPILOT_REASONING_EFFORT_HELP_TIMEOUT_MS
  });
  const output = joinOutput(helpResult.stdout, helpResult.stderr);
  input.recordObservation(
    {
      ...input.telemetryContext,
      configuredTimeoutMs: getCopilotPolicyTimeoutMs('reasoning-help'),
      durationMs: input.now() - startedAtMs,
      errorCategory:
        !helpResult.error && helpResult.status === 0
          ? null
          : classifyCopilotErrorCategory(output, helpResult.error?.message),
      model: input.model,
      operation: 'reasoning-help',
      promptChars: 0,
      provider: 'copilot',
      success: !helpResult.error && helpResult.status === 0,
      timedOut: isCopilotTimedOut(helpResult, output)
    },
    input.repoRoot
  );
  if (helpResult.error || helpResult.status !== 0) {
    return null;
  }

  const supportedFlag = output.includes('--reasoning-effort')
    ? '--reasoning-effort'
    : output.includes('--effort')
      ? '--effort'
      : null;
  input.reasoningEffortSupportCache.set(cacheKey, supportedFlag);
  return supportedFlag;
}

function classifyCopilotProbeFailure(
  output: string,
  errorMessage?: string
): string {
  const message = [output, errorMessage].filter(Boolean).join('\n').trim();

  if (!message) {
    return 'Copilot CLI probe failed without returning output.';
  }

  if (
    /\b(not authenticated|authenticate|login|sign in|credential|token|required)\b/i.test(
      message
    )
  ) {
    return 'Copilot CLI is installed locally but is not logged in.';
  }

  if (
    /\b(quota|premium requests|billing|subscription|rate limit|429|entitlement)\b/i.test(
      message
    )
  ) {
    return 'Copilot CLI is installed locally but does not currently have available request capacity.';
  }

  if (/\b(timeout|timed out)\b/i.test(message)) {
    return 'Copilot CLI probe timed out before it could confirm local availability.';
  }

  return message;
}

function isUnsupportedReasoningEffortError(message?: string): boolean {
  if (!message) {
    return false;
  }

  return (
    /\B--reasoning-effort\b|\B--effort\b/i.test(message) &&
    /\b(unknown|unexpected|unsupported|invalid|not recognized|too many arguments)\b/i.test(
      message
    )
  );
}

function joinOutput(stdout?: string | null, stderr?: string | null): string {
  return [stdout, stderr].filter(Boolean).join('\n').trim();
}

function classifyCopilotErrorCategory(
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

  if (
    /\b(quota|premium requests|billing|subscription|rate limit|429|entitlement)\b/i.test(
      message
    )
  ) {
    return 'capacity';
  }

  if (
    /\b(not authenticated|authenticate|login|sign in|credential|token|required)\b/i.test(
      message
    )
  ) {
    return 'auth';
  }

  if (isUnsupportedReasoningEffortError(message)) {
    return 'unsupported-flag';
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

function isCopilotTimedOut(
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

function stripCopilotFooter(output: string): string {
  const lines = output.split(/\r?\n/);

  while (
    lines.length > 0 &&
    /^\s*(Changes|Requests|Tokens)\b/.test(lines.at(-1) ?? '')
  ) {
    lines.pop();
  }

  while (lines.length > 0 && (lines.at(-1) ?? '').trim() === '') {
    lines.pop();
  }

  return lines.join('\n').trim();
}
