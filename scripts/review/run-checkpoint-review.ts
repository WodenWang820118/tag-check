import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import { cacheProviderHealth } from './provider-health.ts';
import {
  createProviderTelemetryContext,
  type ProviderTelemetryContext
} from './provider-observability.ts';
import {
  isCopilotUnavailableError,
  probeCopilotCliHealth,
  runCopilotReview
} from './providers/copilot.ts';
import {
  isCodexUnavailableError,
  probeCodexCliHealth,
  runCodexReview
} from './providers/codex.ts';
import {
  isGeminiUnavailableError,
  probeGeminiCliHealth,
  runGeminiReview
} from './providers/gemini.ts';

export type ReviewCheckpoint = 'plan' | 'implementation' | 'test' | 'pre-merge';
export type ReviewProvider = 'auto' | 'copilot' | 'gemini' | 'codex';
export type ConcreteReviewProvider = Exclude<ReviewProvider, 'auto'>;
export type ReviewRiskLevel = 'low' | 'medium' | 'high';

const DEFAULT_COPILOT_CLAUDE_MODEL = 'claude-sonnet-4.6';
const DEFAULT_COPILOT_GPT5_MINI_MODEL = 'gpt-5-mini';
const CHANGED_FILES_HEADING = 'changed files:';
const LOW_RISK_MAX_CHANGED_FILES = 2;
const REVIEW_CONTROL_PLANE_PATH_PATTERNS = [
  /(^|\/)scripts\/review\//i,
  /(^|\/)scripts\/review-gate\//i,
  /(^|\/)tools\/scripts\/review\//i,
  /(^|\/)tools\/scripts\/review-gate\//i,
  /(^|\/)(scripts|tools\/scripts)\/package\.json$/i,
  /(^|\/)ag(?:ents)?\.md$/i,
  /(^|\/)\.agents\//i,
  /(^|\/)\.github\//i,
  /(^|\/)\.codex\//i,
  /(^|\/)\.gemini\//i,
  /(^|\/)sync-skills\.ps1$/i
] as const;
const HIGH_RISK_PATH_PATTERNS = [
  /(^|\/)(auth|security)(\/|\.|_|-)/i,
  /(^|\/)(route|routes|router|controller|dto|schema|contract|contracts|api)(\/|\.|_|-)/i,
  /(^|\/)(config|env|settings)(\/|\.|_|-)/i,
  /(^|\/)(cli|runner|command)(\/|\.|_|-)/i,
  /(^|\/)(io|store|storage|persist|persistence|repository)(\/|\.|_|-)/i,
  /(^|\/)(net|network|transport|client|upstream)(\/|\.|_|-)/i,
  /(^|\/)(serialization|serializer|serialize|payload)(\/|\.|_|-)/i,
  /(^|\/)(permission|policy|rbac|role|access-control)(\/|\.|_|-)/i
] as const;
const LOW_RISK_PATH_PATTERNS = [
  /\.md$/i,
  /\.(html|css|scss|less|svg|txt)$/i
] as const;
const HIGH_RISK_FOCUS_PATTERNS = [
  /\bsecurity\b/i,
  /\bauth\b/i,
  /\bsecret\b/i,
  /\bshell\b/i,
  /\bnetwork\b/i,
  /\bfilesystem\b/i,
  /\bcontract\b/i,
  /\bapi\b/i,
  /\bschema\b/i,
  /\bmigration\b/i,
  /\bdatabase\b/i,
  /\bpersist(?:ent|ence)?\b/i,
  /\bpermission\b/i
] as const;
const LOW_RISK_FOCUS_BLOCK_PATTERNS = [
  /\bsecurity\b/i,
  /\bauth\b/i,
  /\btest(?:s|ing)?\b/i,
  /\barchitecture\b/i,
  /\bcontract\b/i,
  /\bapi\b/i,
  /\bschema\b/i,
  /\bmigration\b/i
] as const;
const HIGH_RISK_CONTEXT_PATTERNS = [
  /\bauth\b/i,
  /\boauth\b/i,
  /\blogin\b/i,
  /\bsession\b/i,
  /\bjwt\b/i,
  /\bsecret\b/i,
  /\btoken\b/i,
  /\bpassword\b/i,
  /\bcredential\b/i,
  /\bfilesystem\b/i,
  /\breadfile\b/i,
  /\bwritefile\b/i,
  /\bmkdir\b/i,
  /\brename\b/i,
  /\bchild_process\b/i,
  /\bspawn(?:sync)?\b/i,
  /\bexec(?:sync)?\b/i,
  /\bpowershell\b/i,
  /\bfetch\(/i,
  /\baxios\b/i,
  /\bhttp\./i,
  /\bhttps\./i,
  /\bwebhook\b/i,
  /\broute(?:s)?\b/i,
  /\brouter\b/i,
  /\bhandler\b/i,
  /\bendpoint\b/i,
  /\bcontroller\b/i,
  /\bdto\b/i,
  /\bschema\b/i,
  /\bcontract\b/i,
  /\bgraphql\b/i,
  /\bopenapi\b/i,
  /\bpublic contract\b/i,
  /\bresponse shape\b/i,
  /\bpayload\b/i,
  /\bsecurity\b/i,
  /\baccess-control\b/i,
  /\brbac\b/i,
  /\brole\b/i,
  /\bpermission\b/i,
  /\bpolicy\b/i,
  /\bmigration\b/i,
  /\bdatabase\b/i,
  /\bsql\b/i,
  /\bstorage\b/i,
  /\brepository\b/i,
  /\bconfig\b/i,
  /\benv(?:ironment)?\b/i,
  /\bprovider keys?\b/i,
  /\bapi[_-]?key\b/i,
  /\bsubprocess\b/i,
  /\bprocessbuilder\b/i,
  /\brequests\b/i,
  /\bhttpx\b/i,
  /\burllib\b/i,
  /\bhttp client\b/i,
  /\bhttpclient\b/i,
  /\bwebclient\b/i,
  /\bresttemplate\b/i,
  /\bupstream\b/i
] as const;
const MEDIUM_RISK_CONTEXT_PATTERNS = [
  /\brefactor\b/i,
  /\brollout\b/i,
  /\barchitecture\b/i,
  /\bstate machine\b/i,
  /\bmulti-file\b/i
] as const;

export interface ParsedCliArgs {
  checkpoint?: ReviewCheckpoint;
  contextFile?: string;
  focus: string;
  model?: string;
  provider: ReviewProvider;
}

export interface ReviewExecution {
  checkpoint: ReviewCheckpoint;
  focus: string;
  model?: string;
  provider: ConcreteReviewProvider;
}

export interface ReviewFlowDependencies {
  cacheUnavailable: (execution: ReviewExecution, error: unknown) => void;
  log: (message: string) => void;
  probe: (
    execution: ReviewExecution
  ) => Promise<{ available: boolean; reason?: string }>;
  run: (execution: ReviewExecution, context: string) => Promise<string>;
}

export function parseCliArgs(argv: string[]): ParsedCliArgs {
  const parsed: ParsedCliArgs = {
    provider: 'auto',
    focus: 'general'
  };

  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];

    if (current === '--checkpoint') {
      parsed.checkpoint = readCheckpointFlag(argv[index + 1]);
      index += 1;
      continue;
    }

    if (current === '--focus') {
      parsed.focus = readRequiredValue(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--provider') {
      parsed.provider = readProviderFlag(argv[index + 1]);
      index += 1;
      continue;
    }

    if (current === '--model') {
      parsed.model = readRequiredValue(argv, index, current);
      index += 1;
      continue;
    }

    if (current === '--context-file') {
      parsed.contextFile = readRequiredValue(argv, index, current);
      index += 1;
      continue;
    }

    throw new Error(`Unknown review flag: ${current}`);
  }

  return parsed;
}

export function createReviewExecution(input: {
  checkpoint: ReviewCheckpoint;
  provider: ConcreteReviewProvider;
  focus: string;
  model?: string;
}): ReviewExecution {
  return {
    checkpoint: input.checkpoint,
    provider: input.provider,
    focus: input.focus,
    model:
      input.model ??
      (input.provider === 'copilot'
        ? DEFAULT_COPILOT_CLAUDE_MODEL
        : undefined) ??
      (input.provider === 'gemini'
        ? getDefaultGeminiModel(input.checkpoint)
        : undefined)
  };
}

export function getReviewExecutionPlan(input: {
  checkpoint: ReviewCheckpoint;
  context?: string;
  focus: string;
  model?: string;
  provider: ReviewProvider;
  repoChangedFiles?: string[];
  repoDiffText?: string;
  repoHasUntrackedFiles?: boolean;
}): ReviewExecution[] {
  if (input.provider === 'copilot') {
    if (input.model) {
      return [
        createReviewExecution({
          checkpoint: input.checkpoint,
          provider: 'copilot',
          focus: input.focus,
          model: input.model
        })
      ];
    }

    return [
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_CLAUDE_MODEL
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_GPT5_MINI_MODEL
      })
    ];
  }

  if (input.provider === 'gemini') {
    return [
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'gemini',
        focus: input.focus,
        model: input.model
      })
    ];
  }

  if (input.provider === 'codex') {
    return [
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'codex',
        focus: input.focus,
        model: input.model
      })
    ];
  }

  const autoRisk = inferAutoReviewRisk({
    checkpoint: input.checkpoint,
    context: input.context ?? '',
    focus: input.focus,
    repoChangedFiles: input.repoChangedFiles ?? [],
    repoDiffText: input.repoDiffText ?? '',
    repoHasUntrackedFiles: input.repoHasUntrackedFiles ?? false
  });

  if (
    (input.checkpoint === 'implementation' ||
      input.checkpoint === 'pre-merge') &&
    autoRisk === 'low'
  ) {
    return [
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'codex',
        focus: input.focus
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'gemini',
        focus: input.focus,
        model: getDefaultGeminiModel(input.checkpoint)
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_CLAUDE_MODEL
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_GPT5_MINI_MODEL
      })
    ];
  }

  if (
    input.checkpoint === 'implementation' ||
    input.checkpoint === 'pre-merge'
  ) {
    return [
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'gemini',
        focus: input.focus,
        model: getDefaultGeminiModel(input.checkpoint)
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_CLAUDE_MODEL
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_GPT5_MINI_MODEL
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'codex',
        focus: input.focus
      })
    ];
  }

  if (input.checkpoint === 'test') {
    return [
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_CLAUDE_MODEL
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'gemini',
        focus: input.focus,
        model: getDefaultGeminiModel(input.checkpoint)
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'copilot',
        focus: input.focus,
        model: DEFAULT_COPILOT_GPT5_MINI_MODEL
      }),
      createReviewExecution({
        checkpoint: input.checkpoint,
        provider: 'codex',
        focus: input.focus
      })
    ];
  }

  return [
    createReviewExecution({
      checkpoint: input.checkpoint,
      provider: 'copilot',
      focus: input.focus,
      model: DEFAULT_COPILOT_CLAUDE_MODEL
    }),
    createReviewExecution({
      checkpoint: input.checkpoint,
      provider: 'gemini',
      focus: input.focus,
      model: getDefaultGeminiModel(input.checkpoint)
    }),
    createReviewExecution({
      checkpoint: input.checkpoint,
      provider: 'copilot',
      focus: input.focus,
      model: DEFAULT_COPILOT_GPT5_MINI_MODEL
    }),
    createReviewExecution({
      checkpoint: input.checkpoint,
      provider: 'codex',
      focus: input.focus
    })
  ];
}

export function parseChangedFilesFromContext(context: string): string[] {
  const lines = context.split(/\r?\n/);
  const changedFiles: string[] = [];
  let inChangedFilesSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (!inChangedFilesSection) {
      if (trimmed.toLowerCase() === CHANGED_FILES_HEADING) {
        inChangedFilesSection = true;
      }
      continue;
    }

    if (trimmed.length === 0) {
      break;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (!bulletMatch) {
      break;
    }

    changedFiles.push(normalizeReviewPath(bulletMatch[1] ?? ''));
  }

  return changedFiles.filter(Boolean);
}

export function inferAutoReviewRisk(input: {
  checkpoint: ReviewCheckpoint;
  context: string;
  focus: string;
  repoChangedFiles?: string[];
  repoDiffText?: string;
  repoHasUntrackedFiles?: boolean;
}): ReviewRiskLevel {
  const normalizedFocus = input.focus.trim();
  const changedFiles = parseChangedFilesFromContext(input.context);
  const repoChangedFiles = normalizeReviewPathList(
    input.repoChangedFiles ?? []
  );
  const repoDiffText = input.repoDiffText ?? '';
  const combinedText = `${normalizedFocus}\n${input.context}`;

  if (
    containsPattern(normalizedFocus, HIGH_RISK_FOCUS_PATTERNS) ||
    containsPattern(combinedText, HIGH_RISK_CONTEXT_PATTERNS) ||
    changedFiles.some((filePath) =>
      matchesPathPattern(filePath, HIGH_RISK_PATH_PATTERNS)
    ) ||
    changedFiles.some((filePath) =>
      isReviewControlPlanePath(filePath, input.context)
    )
  ) {
    return 'high';
  }

  if (
    input.checkpoint !== 'implementation' &&
    input.checkpoint !== 'pre-merge'
  ) {
    return 'medium';
  }

  if (
    changedFiles.length === 0 ||
    changedFiles.length > LOW_RISK_MAX_CHANGED_FILES ||
    !matchesRepoChangedFiles(changedFiles, repoChangedFiles) ||
    input.repoHasUntrackedFiles === true ||
    repoDiffText.trim().length === 0 ||
    !diffMentionsRepoChangedFiles(repoChangedFiles, repoDiffText) ||
    containsPattern(repoDiffText, HIGH_RISK_CONTEXT_PATTERNS) ||
    changedFiles.some(
      (filePath) => !matchesPathPattern(filePath, LOW_RISK_PATH_PATTERNS)
    ) ||
    containsPattern(normalizedFocus, LOW_RISK_FOCUS_BLOCK_PATTERNS) ||
    containsPattern(combinedText, MEDIUM_RISK_CONTEXT_PATTERNS)
  ) {
    return 'medium';
  }

  return 'low';
}

export function buildReviewPrompt(
  execution: ReviewExecution,
  context: string
): string {
  const reviewRules = [
    'You are the second-opinion reviewer for this repository.',
    `Checkpoint: ${execution.checkpoint}`,
    `Primary focus: ${execution.focus}`,
    execution.model ? `Requested model: ${execution.model}` : null,
    '',
    'Review rules:',
    '- Findings first, ordered by severity',
    '- Call out correctness, security risk, workflow violations, contract drift, and missing tests',
    execution.checkpoint === 'test'
      ? '- Focus on missing scenarios, weak assertions, and regression gaps'
      : null,
    execution.checkpoint === 'implementation'
      ? '- If blocking issues remain, call out whether this should be escalated to Copilot for a follow-up review'
      : null,
    '',
    'Context to review:',
    context.trim()
  ].filter(Boolean);

  return reviewRules.join('\n');
}

export function createCheckpointReviewTelemetryContext(
  execution: ReviewExecution
): ProviderTelemetryContext {
  return createProviderTelemetryContext({
    callsite: 'checkpoint-review',
    checkpoint: execution.checkpoint
  });
}

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseCliArgs(argv);

  if (!parsed.checkpoint) {
    throw new Error(
      'Missing --checkpoint. Expected one of: plan, implementation, test, pre-merge.'
    );
  }

  const context = await readReviewContext(parsed.contextFile);
  if (!context.trim()) {
    throw new Error(
      'Review context is required. Pass --context-file <path> or pipe the review context via stdin.'
    );
  }
  const output = await executeReviewFlow(
    {
      checkpoint: parsed.checkpoint,
      context,
      focus: parsed.focus,
      model: parsed.model,
      provider: parsed.provider,
      repoChangedFiles: collectRepoChangedFiles(process.cwd()),
      repoDiffText: collectRepoDiffText(process.cwd()),
      repoHasUntrackedFiles: collectRepoHasUntrackedFiles(process.cwd())
    },
    getDefaultReviewFlowDependencies()
  );

  process.stdout.write(`${output.trimEnd()}\n`);
}

async function runReviewExecution(
  execution: ReviewExecution,
  context: string
): Promise<string> {
  const prompt = buildReviewPrompt(execution, context);

  if (execution.provider === 'copilot') {
    return runCopilotReview({
      model: execution.model,
      prompt,
      repoRoot: process.cwd(),
      telemetryContext: createCheckpointReviewTelemetryContext(execution)
    });
  }

  if (execution.provider === 'gemini') {
    return runGeminiReview({
      model: execution.model ?? getDefaultGeminiModel(execution.checkpoint),
      prompt,
      repoRoot: process.cwd(),
      telemetryContext: createCheckpointReviewTelemetryContext(execution)
    });
  }

  return runCodexReview({
    checkpoint: execution.checkpoint,
    focus: execution.focus,
    model: execution.model,
    prompt,
    repoRoot: process.cwd()
  });
}

async function readReviewContext(contextFile?: string): Promise<string> {
  if (contextFile) {
    const resolvedPath = resolve(contextFile);
    if (!existsSync(resolvedPath)) {
      throw new Error(`Context file not found: ${resolvedPath}`);
    }

    return readFileSync(resolvedPath, 'utf8');
  }

  return readStdin();
}

function getDefaultGeminiModel(checkpoint: ReviewCheckpoint): string {
  return checkpoint === 'implementation'
    ? 'gemini-3-flash-preview'
    : 'gemini-2.5-pro';
}

export async function executeReviewFlow(
  input: {
    checkpoint: ReviewCheckpoint;
    context: string;
    focus: string;
    model?: string;
    provider: ReviewProvider;
    repoChangedFiles?: string[];
    repoDiffText?: string;
    repoHasUntrackedFiles?: boolean;
  },
  dependencies: ReviewFlowDependencies
): Promise<string> {
  const attempted: string[] = [];
  const executions = getReviewExecutionPlan({
    checkpoint: input.checkpoint,
    context: input.context,
    focus: input.focus,
    model: input.model,
    provider: input.provider,
    repoChangedFiles: input.repoChangedFiles,
    repoDiffText: input.repoDiffText,
    repoHasUntrackedFiles: input.repoHasUntrackedFiles
  });
  const fallbackAllowed = executions.length > 1;

  for (const execution of executions) {
    const executionLabel = formatExecutionLabel(execution);

    const health = await dependencies.probe(execution);
    if (!health.available) {
      attempted.push(`${executionLabel}: ${health.reason ?? 'unavailable'}`);
      if (!fallbackAllowed) {
        throw new Error(
          `${getProviderDisplayName(execution.provider)} review is unavailable: ${health.reason ?? 'health check failed.'}`
        );
      }

      dependencies.log(
        `${getExecutionDisplayName(execution)} review is unavailable: ${health.reason ?? 'health check failed.'}`
      );
      continue;
    }

    try {
      return await dependencies.run(execution, input.context);
    } catch (error) {
      if (
        fallbackAllowed &&
        isRetryableProviderFailure(execution.provider, error)
      ) {
        dependencies.cacheUnavailable(execution, error);
        attempted.push(
          `${executionLabel}: ${error instanceof Error ? error.message : String(error)}`
        );
        dependencies.log(
          `${getExecutionDisplayName(execution)} review became unavailable during execution. Trying the next fallback.`
        );
        continue;
      }

      throw error;
    }
  }

  throw new Error(buildNoAvailableProvidersError(attempted));
}

function readRequiredValue(
  argv: string[],
  index: number,
  flag: string
): string {
  const value = argv[index + 1];
  if (!value) {
    throw new Error(`Missing value for ${flag}.`);
  }

  return value;
}

function readCheckpointFlag(rawValue?: string): ReviewCheckpoint {
  if (
    rawValue === 'plan' ||
    rawValue === 'implementation' ||
    rawValue === 'test' ||
    rawValue === 'pre-merge'
  ) {
    return rawValue;
  }

  throw new Error(
    `Unsupported checkpoint "${rawValue ?? ''}". Expected one of: plan, implementation, test, pre-merge.`
  );
}

function readProviderFlag(rawValue?: string): ReviewProvider {
  if (
    rawValue === 'auto' ||
    rawValue === 'copilot' ||
    rawValue === 'gemini' ||
    rawValue === 'codex'
  ) {
    return rawValue;
  }

  throw new Error(
    `Unsupported provider "${rawValue ?? ''}". Expected one of: auto, copilot, gemini, codex.`
  );
}

async function probeReviewProviderHealth(execution: ReviewExecution) {
  if (execution.provider === 'copilot') {
    return probeCopilotCliHealth({
      model: getProviderHealthModel(execution),
      repoRoot: process.cwd(),
      telemetryContext: createCheckpointReviewTelemetryContext(execution)
    });
  }

  if (execution.provider === 'gemini') {
    return probeGeminiCliHealth({
      model: execution.model ?? getDefaultGeminiModel(execution.checkpoint),
      repoRoot: process.cwd(),
      telemetryContext: createCheckpointReviewTelemetryContext(execution)
    });
  }

  return probeCodexCliHealth({
    model: getProviderHealthModel(execution),
    repoRoot: process.cwd()
  });
}

function getDefaultReviewFlowDependencies(): ReviewFlowDependencies {
  return {
    cacheUnavailable(execution, error) {
      cacheProviderHealth(
        execution.provider,
        getProviderHealthModel(execution),
        {
          available: false,
          checkedAtMs: Date.now(),
          reason: error instanceof Error ? error.message : String(error)
        },
        process.cwd()
      );
    },
    log(message) {
      if (process.env.REVIEW_CHECKPOINT_DEBUG === '1') {
        console.error(message);
      }
    },
    probe: probeReviewProviderHealth,
    run: runReviewExecution
  };
}

function isRetryableProviderFailure(
  provider: ConcreteReviewProvider,
  error: unknown
): boolean {
  if (provider === 'copilot') {
    return isCopilotUnavailableError(error);
  }

  if (provider === 'gemini') {
    return isGeminiUnavailableError(error);
  }

  return isCodexUnavailableError(error);
}

function getProviderDisplayName(provider: ConcreteReviewProvider): string {
  if (provider === 'copilot') {
    return 'Copilot CLI';
  }

  if (provider === 'gemini') {
    return 'Gemini CLI';
  }

  return 'Codex reviewer';
}

function getExecutionDisplayName(execution: ReviewExecution): string {
  if (!execution.model) {
    return getProviderDisplayName(execution.provider);
  }

  return `${getProviderDisplayName(execution.provider)} (${execution.model})`;
}

function formatExecutionLabel(execution: ReviewExecution): string {
  if (!execution.model) {
    return execution.provider;
  }

  return `${execution.provider}:${execution.model}`;
}

function getProviderHealthModel(
  execution: ReviewExecution
): string | undefined {
  if (execution.provider === 'codex') {
    return undefined;
  }

  return execution.model;
}

function buildNoAvailableProvidersError(attempted: string[]): string {
  if (attempted.length === 0) {
    return 'No review provider was available for this checkpoint.';
  }

  return [
    'No review provider was available for this checkpoint.',
    'Attempted providers:',
    ...attempted.map((entry) => `- ${entry}`)
  ].join('\n');
}

function containsPattern(
  text: string,
  patterns: ReadonlyArray<RegExp>
): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

function collectRepoChangedFiles(repoRoot: string): string[] {
  const statusLines = collectRepoStatusLines(repoRoot);
  if (statusLines.length === 0) {
    return [];
  }

  const changedFiles = statusLines.map(parsePorcelainPath).filter(Boolean);

  return normalizeReviewPathList(changedFiles);
}

function collectRepoHasUntrackedFiles(repoRoot: string): boolean {
  return collectRepoStatusLines(repoRoot).some((line) =>
    line.startsWith('?? ')
  );
}

function collectRepoStatusLines(repoRoot: string): string[] {
  const result = spawnSync(
    'git',
    ['status', '--porcelain', '--untracked-files=all'],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore']
    }
  );

  if (result.error || result.status !== 0 || !result.stdout) {
    return [];
  }

  return result.stdout
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean);
}

function collectRepoDiffText(repoRoot: string): string {
  const commands = [
    ['diff', '--no-color', '--no-ext-diff'],
    ['diff', '--no-color', '--no-ext-diff', '--cached']
  ];

  const outputs = commands
    .map((args) =>
      spawnSync('git', args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore']
      })
    )
    .filter((result) => !result.error && result.status === 0)
    .map((result) => result.stdout?.trim() ?? '')
    .filter(Boolean);

  return outputs.join('\n').trim();
}

function isReviewControlPlanePath(filePath: string, context: string): boolean {
  const normalizedPath = normalizeReviewPath(filePath);
  if (
    REVIEW_CONTROL_PLANE_PATH_PATTERNS.some((pattern) =>
      pattern.test(normalizedPath)
    )
  ) {
    return true;
  }

  return /^package\.json$/i.test(normalizedPath);
}

function normalizeReviewPath(candidate: string): string {
  const normalized = candidate
    .replaceAll('\\', '/')
    .replace(/^[A-Za-z]:\//, '')
    .replace(/^\/+/, '')
    .replace(/^\.\//, '')
    .trim();

  const workspaceAnchors = [
    '/apps/',
    '/libs/',
    '/packages/',
    '/scripts/',
    '/tools/',
    '/docs/',
    '/.agents/',
    '/.github/',
    '/.codex/',
    '/.gemini/',
    '/AGENTS.md',
    '/sync-skills.ps1'
  ];

  for (const anchor of workspaceAnchors) {
    const index = normalized.indexOf(anchor);
    if (index >= 0) {
      return normalized.slice(index + 1);
    }
  }

  return normalized;
}

function normalizeReviewPathList(paths: ReadonlyArray<string>): string[] {
  return paths.map(normalizeReviewPath).filter(Boolean);
}

function matchesPathPattern(
  filePath: string,
  patterns: ReadonlyArray<RegExp>
): boolean {
  const normalizedPath = normalizeReviewPath(filePath);
  return patterns.some((pattern) => pattern.test(normalizedPath));
}

function matchesRepoChangedFiles(
  contextChangedFiles: ReadonlyArray<string>,
  repoChangedFiles: ReadonlyArray<string>
): boolean {
  if (contextChangedFiles.length === 0 || repoChangedFiles.length === 0) {
    return false;
  }

  const contextSet = new Set(normalizeReviewPathList(contextChangedFiles));
  const repoSet = new Set(normalizeReviewPathList(repoChangedFiles));

  if (contextSet.size !== repoSet.size) {
    return false;
  }

  return [...contextSet].every((filePath) => repoSet.has(filePath));
}

function diffMentionsRepoChangedFiles(
  repoChangedFiles: ReadonlyArray<string>,
  repoDiffText: string
): boolean {
  if (repoChangedFiles.length === 0 || repoDiffText.trim().length === 0) {
    return false;
  }

  return normalizeReviewPathList(repoChangedFiles).every((filePath) =>
    diffContainsFileHeader(repoDiffText, filePath)
  );
}

function diffContainsFileHeader(
  repoDiffText: string,
  filePath: string
): boolean {
  const escapedFilePath = escapeRegExp(filePath);
  const headerPatterns = [
    new RegExp(`^diff --git a/${escapedFilePath} b/${escapedFilePath}$`, 'm'),
    new RegExp(`^diff --git a/${escapedFilePath} b/dev/null$`, 'm'),
    new RegExp(`^diff --git a/dev/null b/${escapedFilePath}$`, 'm'),
    new RegExp(`^--- a/${escapedFilePath}$`, 'm'),
    new RegExp(`^\\+\\+\\+ b/${escapedFilePath}$`, 'm')
  ];

  return headerPatterns.some((pattern) => pattern.test(repoDiffText));
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parsePorcelainPath(line: string): string {
  const candidate = line.slice(3).trim();
  const renameSegments = candidate.split(' -> ');
  return renameSegments.at(-1)?.trim() ?? candidate;
}

function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return Promise.resolve('');
  }

  return new Promise((resolveInput, reject) => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
    });
    process.stdin.on('end', () => resolveInput(buffer));
    process.stdin.on('error', reject);
  });
}

const isEntryPoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
