import { cacheProviderHealth } from '../../provider-health/provider-health.ts';
import {
  createProviderTelemetryContext,
  type ProviderTelemetryContext
} from '../../provider-observability/provider-observability.ts';
import {
  isCopilotUnavailableError,
  probeCopilotCliHealth,
  runCopilotReview
} from '../../providers/copilot/copilot.ts';
import {
  isCodexUnavailableError,
  probeCodexCliHealth,
  runCodexReview
} from '../../providers/codex/codex.ts';
import {
  isGeminiUnavailableError,
  probeGeminiCliHealth,
  runGeminiReview
} from '../../providers/gemini/gemini.ts';
import { buildReviewPrompt } from '../cli-args-and-prompt/cli-args-and-prompt.ts';
import { inferAutoReviewRisk } from '../risk-policy/risk-policy.ts';
import {
  type ConcreteReviewProvider,
  DEFAULT_COPILOT_CLAUDE_MODEL,
  DEFAULT_COPILOT_GPT5_MINI_MODEL,
  getDefaultGeminiModel,
  type ReviewCheckpoint,
  type ReviewExecution,
  type ReviewFlowDependencies,
  type ReviewProvider
} from '../shared/shared.ts';

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

export function createCheckpointReviewTelemetryContext(
  execution: ReviewExecution
): ProviderTelemetryContext {
  return createProviderTelemetryContext({
    callsite: 'checkpoint-review',
    checkpoint: execution.checkpoint
  });
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

export function getDefaultReviewFlowDependencies(): ReviewFlowDependencies {
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

async function runReviewExecution(
  execution: ReviewExecution,
  context: string
): Promise<string> {
  const prompt = buildReviewPrompt(execution, context);

  if (execution.provider === 'copilot') {
    return runCopilotReview({
      checkpoint: execution.checkpoint,
      focus: execution.focus,
      model: execution.model,
      prompt,
      repoRoot: process.cwd(),
      telemetryContext: createCheckpointReviewTelemetryContext(execution)
    });
  }

  if (execution.provider === 'gemini') {
    return runGeminiReview({
      checkpoint: execution.checkpoint,
      focus: execution.focus,
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
    return 'Antigravity CLI';
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
