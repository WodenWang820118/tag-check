import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildReviewPrompt,
  createCheckpointReviewTelemetryContext,
  createReviewExecution,
  executeReviewFlow,
  getReviewExecutionPlan,
  inferAutoReviewRisk,
  parseCliArgs,
  parseChangedFilesFromContext,
  type ReviewExecution
} from './run-checkpoint-review.ts';
import { createProviderObservationBucketKey } from './provider-observability.ts';

test('parseCliArgs reads the supported checkpoint review flags', () => {
  const parsed = parseCliArgs([
    '--checkpoint',
    'plan',
    '--provider',
    'codex',
    '--model',
    'gpt-5.4',
    '--focus',
    'architecture',
    '--context-file',
    'review.md'
  ]);

  assert.equal(parsed.checkpoint, 'plan');
  assert.equal(parsed.provider, 'codex');
  assert.equal(parsed.model, 'gpt-5.4');
  assert.equal(parsed.focus, 'architecture');
  assert.equal(parsed.contextFile, 'review.md');
});

test('getReviewExecutionPlan follows the repo checkpoint fallback rules', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'plan',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'auto'
    }),
    [
      execution('plan', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('plan', 'gemini', 'general', 'gemini-2.5-pro'),
      execution('plan', 'copilot', 'general', 'gpt-5-mini'),
      execution('plan', 'codex', 'general')
    ]
  );

  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'implementation',
      context: 'Summary only with no changed files section.',
      focus: 'general',
      provider: 'auto'
    }),
    [
      execution(
        'implementation',
        'gemini',
        'general',
        'gemini-3-flash-preview'
      ),
      execution('implementation', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('implementation', 'copilot', 'general', 'gpt-5-mini'),
      execution('implementation', 'codex', 'general')
    ]
  );

  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'test',
      context: lowRiskImplementationContext(),
      focus: 'tests',
      provider: 'auto'
    }),
    [
      execution('test', 'copilot', 'tests', 'claude-sonnet-4.6'),
      execution('test', 'gemini', 'tests', 'gemini-2.5-pro'),
      execution('test', 'copilot', 'tests', 'gpt-5-mini'),
      execution('test', 'codex', 'tests')
    ]
  );

  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'pre-merge',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'copilot'
    }),
    [
      execution('pre-merge', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('pre-merge', 'copilot', 'general', 'gpt-5-mini')
    ]
  );

  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'test',
      context: lowRiskImplementationContext(),
      focus: 'tests',
      provider: 'copilot',
      model: 'gpt-5-mini'
    }),
    [execution('test', 'copilot', 'tests', 'gpt-5-mini')]
  );
});

test('parseChangedFilesFromContext reads the bullet list under the changed files heading', () => {
  assert.deepEqual(
    parseChangedFilesFromContext(lowRiskImplementationContext()),
    [
      'apps/law-prep-web/src/app/app.component.html',
      'apps/law-prep-web/src/app/app.component.scss'
    ]
  );
});

test('parseChangedFilesFromContext normalizes Windows-style paths', () => {
  assert.deepEqual(
    parseChangedFilesFromContext(
      [
        'Changed files:',
        '- .\\tools\\scripts\\review\\run-checkpoint-review.ts',
        ''
      ].join('\n')
    ),
    ['tools/scripts/review/run-checkpoint-review.ts']
  );
});

test('inferAutoReviewRisk keeps sparse implementation context at medium risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: 'Summary only with no changed files section.',
      focus: 'general'
    }),
    'medium'
  );
});

test('inferAutoReviewRisk marks review control-plane files as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- tools/scripts/review/run-checkpoint-review.ts',
        '',
        'Notes:',
        '- Updates implementation routing.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks review-related package script changes as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- package.json',
        '',
        'Summary:',
        '- Update review:implementation to use a new routing policy.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks root package json changes as high risk even with generic wording', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- package.json',
        '',
        'Summary:',
        '- Update npm scripts for the new workflow.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk does not collapse nested package json files into the root manifest bucket', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-ai-service/package.json',
        '',
        'Summary:',
        '- Update one workspace-local dependency only.'
      ].join('\n'),
      focus: 'general'
    }),
    'medium'
  );
});

test('inferAutoReviewRisk marks auth-heavy context as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-web/src/app/auth.guard.ts',
        '',
        'Summary:',
        '- Tighten auth session handling for login flow.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks public-contract route changes as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-ai-service/src/app/routes.py',
        '',
        'Summary:',
        '- Adjust HTTP response shape.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks plain api contract files as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-ai-service/src/app/api.ts',
        '',
        'Summary:',
        '- Small API cleanup.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks control-plane config files as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: ['Changed files:', '- .codex/config.toml', ''].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks absolute control-plane paths as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- C:\\software-dev\\gx.law-prep\\.gemini\\settings.json',
        '',
        'Summary:',
        '- Adjust reviewer runtime settings.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks reviewer and skill governance files as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- .agents/reviewers/security-reviewer.md',
        '',
        'Summary:',
        '- Tighten reviewer guidance.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks access-control and env config changes as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-engine/src/security/access-control.ts',
        '- apps/law-prep-ai-service/src/config/env.ts',
        '',
        'Summary:',
        '- Tighten admin role checks and load provider keys from environment variables.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks python and java process or network surfaces as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-ai-service/src/runtime/process_runner.py',
        '- apps/law-prep-engine/src/clients/UpstreamClient.java',
        '',
        'Summary:',
        '- Use subprocess and the HTTP client for upstream requests.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks permission policy changes as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-engine/src/security/PermissionPolicy.java',
        '',
        'Summary:',
        '- Tighten permission policy checks.'
      ].join('\n'),
      focus: 'general'
    }),
    'high'
  );
});

test('inferAutoReviewRisk marks high-risk focus as high risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'security',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: lowRiskRepositoryDiffText()
    }),
    'high'
  );
});

test('inferAutoReviewRisk requires the context changed-file list to match repo changes before classifying low risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      repoChangedFiles: ['apps/law-prep-web/src/app/other.component.ts'],
      repoDiffText: lowRiskRepositoryDiffText()
    }),
    'medium'
  );
});

test('inferAutoReviewRisk keeps repos with untracked files at medium risk even with otherwise low-risk context', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: lowRiskRepositoryDiffText(),
      repoHasUntrackedFiles: true
    }),
    'medium'
  );
});

test('inferAutoReviewRisk requires the repo diff text to stay non-sensitive before classifying low risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText:
        'diff --git a/file b/file\n+const token = process.env.API_KEY;\n'
    }),
    'medium'
  );
});

test('inferAutoReviewRisk requires each changed file to have real diff-header evidence before classifying low risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: [
        'diff --git a/apps/law-prep-web/src/app/app.component.html b/apps/law-prep-web/src/app/app.component.html',
        '@@',
        '+See styles in apps/law-prep-web/src/app/app.component.scss'
      ].join('\n')
    }),
    'medium'
  );
});

test('inferAutoReviewRisk requires a non-empty repo diff before classifying low risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: ''
    }),
    'medium'
  );
});

test('inferAutoReviewRisk requires the repo diff text to mention the repo changed files before classifying low risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: 'diff --git a/other/file.ts b/other/file.ts\n@@\n'
    }),
    'medium'
  );
});

test('inferAutoReviewRisk keeps executable ui files at medium risk even with small matching diffs', () => {
  const context = [
    'Changed files:',
    '- apps/law-prep-web/src/app/admin.page.ts',
    '',
    'Summary:',
    '- Small UI flow tweak only.'
  ].join('\n');

  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context,
      focus: 'general',
      repoChangedFiles: ['apps/law-prep-web/src/app/admin.page.ts'],
      repoDiffText: [
        'diff --git a/apps/law-prep-web/src/app/admin.page.ts b/apps/law-prep-web/src/app/admin.page.ts',
        '@@',
        "-const isAdmin = currentUser?.roles?.includes('admin');",
        '+const isAdmin = true;'
      ].join('\n')
    }),
    'medium'
  );
});

test('inferAutoReviewRisk matches normalized repo changed files when the repo paths are absolute Windows paths', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      repoChangedFiles: [
        'C:\\software-dev\\gx.law-prep\\apps\\law-prep-web\\src\\app\\app.component.html',
        'C:\\software-dev\\gx.law-prep\\apps\\law-prep-web\\src\\app\\app.component.scss'
      ],
      repoDiffText: lowRiskRepositoryDiffText()
    }),
    'low'
  );
});

test('inferAutoReviewRisk keeps larger changed-file lists at medium risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-web/src/app/a.ts',
        '- apps/law-prep-web/src/app/b.ts',
        '- apps/law-prep-web/src/app/c.ts',
        '',
        'Summary:',
        '- Small refactor.'
      ].join('\n'),
      focus: 'general'
    }),
    'medium'
  );
});

test('inferAutoReviewRisk keeps blocked focuses at medium risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'architecture'
    }),
    'medium'
  );
});

test('inferAutoReviewRisk keeps refactor-heavy context at medium risk', () => {
  assert.equal(
    inferAutoReviewRisk({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-web/src/app/app.component.ts',
        '',
        'Summary:',
        '- Refactor shared wiring for rollout safety.'
      ].join('\n'),
      focus: 'general'
    }),
    'medium'
  );
});

test('getReviewExecutionPlan prefers Codex first for low-risk implementation reviews', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'auto',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: lowRiskRepositoryDiffText()
    }),
    [
      execution('implementation', 'codex', 'general'),
      execution(
        'implementation',
        'gemini',
        'general',
        'gemini-3-flash-preview'
      ),
      execution('implementation', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('implementation', 'copilot', 'general', 'gpt-5-mini')
    ]
  );
});

test('getReviewExecutionPlan keeps high-risk implementation reviews on the non-Codex-first path', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- package.json',
        '',
        'Summary:',
        '- Update review:implementation script routing.'
      ].join('\n'),
      focus: 'general',
      provider: 'auto'
    }),
    [
      execution(
        'implementation',
        'gemini',
        'general',
        'gemini-3-flash-preview'
      ),
      execution('implementation', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('implementation', 'copilot', 'general', 'gpt-5-mini'),
      execution('implementation', 'codex', 'general')
    ]
  );
});

test('getReviewExecutionPlan keeps contract-like implementation reviews on the non-Codex-first path', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-ai-service/src/app/routes.py',
        '',
        'Summary:',
        '- Adjust HTTP response shape.'
      ].join('\n'),
      focus: 'general',
      provider: 'auto'
    }),
    [
      execution(
        'implementation',
        'gemini',
        'general',
        'gemini-3-flash-preview'
      ),
      execution('implementation', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('implementation', 'copilot', 'general', 'gpt-5-mini'),
      execution('implementation', 'codex', 'general')
    ]
  );
});

test('getReviewExecutionPlan keeps api-like implementation reviews on the non-Codex-first path', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'implementation',
      context: [
        'Changed files:',
        '- apps/law-prep-ai-service/src/app/api.ts',
        '',
        'Summary:',
        '- Small API cleanup.'
      ].join('\n'),
      focus: 'general',
      provider: 'auto'
    }),
    [
      execution(
        'implementation',
        'gemini',
        'general',
        'gemini-3-flash-preview'
      ),
      execution('implementation', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('implementation', 'copilot', 'general', 'gpt-5-mini'),
      execution('implementation', 'codex', 'general')
    ]
  );
});

test('getReviewExecutionPlan prefers Codex first for low-risk pre-merge reviews', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'pre-merge',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'auto',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: lowRiskRepositoryDiffText()
    }),
    [
      execution('pre-merge', 'codex', 'general'),
      execution('pre-merge', 'gemini', 'general', 'gemini-2.5-pro'),
      execution('pre-merge', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('pre-merge', 'copilot', 'general', 'gpt-5-mini')
    ]
  );
});

test('getReviewExecutionPlan keeps risky pre-merge reviews on the non-Codex-first path', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'pre-merge',
      context: [
        'Changed files:',
        '- package.json',
        '',
        'Summary:',
        '- Update review:implementation script routing.'
      ].join('\n'),
      focus: 'general',
      provider: 'auto'
    }),
    [
      execution('pre-merge', 'gemini', 'general', 'gemini-2.5-pro'),
      execution('pre-merge', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('pre-merge', 'copilot', 'general', 'gpt-5-mini'),
      execution('pre-merge', 'codex', 'general')
    ]
  );
});

test('createReviewExecution applies provider-specific model defaults', () => {
  assert.deepEqual(
    createReviewExecution({
      checkpoint: 'implementation',
      provider: 'gemini',
      focus: 'general'
    }),
    {
      checkpoint: 'implementation',
      provider: 'gemini',
      focus: 'general',
      model: 'gemini-3-flash-preview'
    }
  );

  assert.deepEqual(
    createReviewExecution({
      checkpoint: 'plan',
      provider: 'copilot',
      focus: 'architecture'
    }),
    {
      checkpoint: 'plan',
      provider: 'copilot',
      focus: 'architecture',
      model: 'claude-sonnet-4.6'
    }
  );

  assert.deepEqual(
    createReviewExecution({
      checkpoint: 'plan',
      provider: 'codex',
      focus: 'architecture'
    }),
    {
      checkpoint: 'plan',
      provider: 'codex',
      focus: 'architecture',
      model: undefined
    }
  );
});

test('getReviewExecutionPlan keeps plan review on the existing default order even with low-risk context', () => {
  assert.deepEqual(
    getReviewExecutionPlan({
      checkpoint: 'plan',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'auto'
    }),
    [
      execution('plan', 'copilot', 'general', 'claude-sonnet-4.6'),
      execution('plan', 'gemini', 'general', 'gemini-2.5-pro'),
      execution('plan', 'copilot', 'general', 'gpt-5-mini'),
      execution('plan', 'codex', 'general')
    ]
  );
});

test('buildReviewPrompt includes the checkpoint, focus, and supplied context', () => {
  const prompt = buildReviewPrompt(
    {
      checkpoint: 'implementation',
      provider: 'gemini',
      focus: 'security',
      model: 'gemini-3-flash-preview'
    },
    'Changed files: tools/scripts/review-gate/shared.ts'
  );

  assert.match(prompt, /Checkpoint: implementation/);
  assert.match(prompt, /Primary focus: security/);
  assert.match(
    prompt,
    /Changed files: tools\/scripts\/review-gate\/shared\.ts/
  );
});

test('createCheckpointReviewTelemetryContext keeps checkpoint buckets distinct', () => {
  const planBucket = createProviderObservationBucketKey({
    ...createCheckpointReviewTelemetryContext(
      execution('plan', 'copilot', 'general', 'claude-sonnet-4.6')
    ),
    model: 'claude-sonnet-4.6',
    operation: 'review',
    provider: 'copilot'
  });
  const implementationBucket = createProviderObservationBucketKey({
    ...createCheckpointReviewTelemetryContext(
      execution('implementation', 'copilot', 'general', 'claude-sonnet-4.6')
    ),
    model: 'claude-sonnet-4.6',
    operation: 'review',
    provider: 'copilot'
  });

  assert.notEqual(planBucket, implementationBucket);
  assert.match(planBucket, /checkpoint-review/);
  assert.match(planBucket, /\bplan\b/);
  assert.doesNotMatch(planBucket, /\bimplementation\b/);
  assert.match(implementationBucket, /checkpoint-review/);
  assert.match(implementationBucket, /\bimplementation\b/);
  assert.doesNotMatch(implementationBucket, /\bplan\b/);
});

test('executeReviewFlow fails fast for a single explicit unavailable provider', async () => {
  await assert.rejects(
    executeReviewFlow(
      {
        checkpoint: 'plan',
        context: 'smoke',
        focus: 'general',
        provider: 'gemini'
      },
      {
        cacheUnavailable() {
          return undefined;
        },
        log() {
          return undefined;
        },
        async probe() {
          return {
            available: false,
            reason: 'quota exhausted'
          };
        },
        async run() {
          return 'should not run';
        }
      }
    ),
    /Gemini CLI review is unavailable: quota exhausted/
  );
});

test('executeReviewFlow prefers Gemini before Copilot GPT-5 mini in auto routing', async () => {
  const probed: string[] = [];

  const output = await executeReviewFlow(
    {
      checkpoint: 'test',
      context: 'smoke',
      focus: 'tests',
      provider: 'auto'
    },
    {
      cacheUnavailable() {
        return undefined;
      },
      log() {
        return undefined;
      },
      async probe(execution) {
        probed.push(`${execution.provider}:${execution.model ?? '<none>'}`);
        if (execution.model === 'claude-sonnet-4.6') {
          return { available: false, reason: 'quota exhausted' };
        }

        return { available: true };
      },
      async run(execution) {
        return execution.model ?? execution.provider;
      }
    }
  );

  assert.deepEqual(probed, [
    'copilot:claude-sonnet-4.6',
    'gemini:gemini-2.5-pro'
  ]);
  assert.equal(output, 'gemini-2.5-pro');
});

test('executeReviewFlow falls back to Copilot GPT-5 mini before Codex after Gemini fails for test checkpoints', async () => {
  const probed: string[] = [];

  const output = await executeReviewFlow(
    {
      checkpoint: 'test',
      context: 'smoke',
      focus: 'tests',
      provider: 'auto'
    },
    {
      cacheUnavailable() {
        return undefined;
      },
      log() {
        return undefined;
      },
      async probe(execution) {
        probed.push(`${execution.provider}:${execution.model ?? '<none>'}`);
        if (
          execution.provider === 'copilot' ||
          execution.provider === 'gemini'
        ) {
          return { available: false, reason: 'quota exhausted' };
        }

        return { available: true };
      },
      async run(execution) {
        return execution.provider;
      }
    }
  );

  assert.deepEqual(probed, [
    'copilot:claude-sonnet-4.6',
    'gemini:gemini-2.5-pro',
    'copilot:gpt-5-mini',
    'codex:<none>'
  ]);
  assert.equal(output, 'codex');
});

test('executeReviewFlow retries the next provider after a retryable runtime failure', async () => {
  const cached: Array<{ provider: string; reason: string }> = [];
  const ran: string[] = [];

  const output = await executeReviewFlow(
    {
      checkpoint: 'implementation',
      context: 'smoke',
      focus: 'general',
      provider: 'auto'
    },
    {
      cacheUnavailable(execution, error) {
        cached.push({
          provider: execution.provider,
          reason: error instanceof Error ? error.message : String(error)
        });
      },
      log() {
        return undefined;
      },
      async probe() {
        return { available: true };
      },
      async run(execution) {
        ran.push(execution.provider);
        if (execution.provider === 'gemini') {
          throw new Error('MODEL_CAPACITY_EXHAUSTED');
        }

        return execution.provider;
      }
    }
  );

  assert.equal(output, 'copilot');
  assert.deepEqual(ran, ['gemini', 'copilot']);
  assert.deepEqual(cached, [
    {
      provider: 'gemini',
      reason: 'MODEL_CAPACITY_EXHAUSTED'
    }
  ]);
});

test('executeReviewFlow probes and runs Codex first for low-risk implementation reviews', async () => {
  const probed: string[] = [];
  const ran: string[] = [];

  const output = await executeReviewFlow(
    {
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'auto',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: lowRiskRepositoryDiffText()
    },
    {
      cacheUnavailable() {
        return undefined;
      },
      log() {
        return undefined;
      },
      async probe(execution) {
        probed.push(`${execution.provider}:${execution.model ?? '<none>'}`);
        return { available: true };
      },
      async run(execution) {
        ran.push(`${execution.provider}:${execution.model ?? '<none>'}`);
        return execution.provider;
      }
    }
  );

  assert.deepEqual(probed, ['codex:<none>']);
  assert.deepEqual(ran, ['codex:<none>']);
  assert.equal(output, 'codex');
});

test('executeReviewFlow falls back from Codex to Gemini for low-risk implementation reviews when Codex fails retryably', async () => {
  const ran: string[] = [];

  const output = await executeReviewFlow(
    {
      checkpoint: 'implementation',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'auto',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: lowRiskRepositoryDiffText()
    },
    {
      cacheUnavailable() {
        return undefined;
      },
      log() {
        return undefined;
      },
      async probe() {
        return { available: true };
      },
      async run(execution) {
        ran.push(`${execution.provider}:${execution.model ?? '<none>'}`);
        if (execution.provider === 'codex') {
          throw new Error('subscription required');
        }

        return execution.provider;
      }
    }
  );

  assert.deepEqual(ran, ['codex:<none>', 'gemini:gemini-3-flash-preview']);
  assert.equal(output, 'gemini');
});

test('executeReviewFlow probes and runs Codex first for low-risk pre-merge reviews', async () => {
  const probed: string[] = [];
  const ran: string[] = [];

  const output = await executeReviewFlow(
    {
      checkpoint: 'pre-merge',
      context: lowRiskImplementationContext(),
      focus: 'general',
      provider: 'auto',
      repoChangedFiles: lowRiskRepositoryChangedFiles(),
      repoDiffText: lowRiskRepositoryDiffText()
    },
    {
      cacheUnavailable() {
        return undefined;
      },
      log() {
        return undefined;
      },
      async probe(execution) {
        probed.push(`${execution.provider}:${execution.model ?? '<none>'}`);
        return { available: true };
      },
      async run(execution) {
        ran.push(`${execution.provider}:${execution.model ?? '<none>'}`);
        return execution.provider;
      }
    }
  );

  assert.deepEqual(probed, ['codex:<none>']);
  assert.deepEqual(ran, ['codex:<none>']);
  assert.equal(output, 'codex');
});

test('executeReviewFlow reports all unavailable providers when auto routing is exhausted', async () => {
  await assert.rejects(
    executeReviewFlow(
      {
        checkpoint: 'plan',
        context: 'smoke',
        focus: 'general',
        provider: 'auto'
      },
      {
        cacheUnavailable() {
          return undefined;
        },
        log() {
          return undefined;
        },
        async probe(execution: ReviewExecution) {
          return {
            available: false,
            reason: `${execution.provider} down`
          };
        },
        async run() {
          return 'should not run';
        }
      }
    ),
    /Attempted providers:[\s\S]*copilot:claude-sonnet-4\.6: copilot down[\s\S]*gemini:gemini-2\.5-pro: gemini down[\s\S]*copilot:gpt-5-mini: copilot down[\s\S]*codex: codex down/
  );
});

function execution(
  checkpoint: ReviewExecution['checkpoint'],
  provider: ReviewExecution['provider'],
  focus: string,
  model?: string
): ReviewExecution {
  return {
    checkpoint,
    provider,
    focus,
    model
  };
}

function lowRiskImplementationContext(): string {
  return [
    'Changed files:',
    '- apps/law-prep-web/src/app/app.component.html',
    '- apps/law-prep-web/src/app/app.component.scss',
    '',
    'Summary:',
    '- Small UI markup and style adjustment only.'
  ].join('\n');
}

function lowRiskRepositoryChangedFiles(): string[] {
  return [
    'apps/law-prep-web/src/app/app.component.html',
    'apps/law-prep-web/src/app/app.component.scss'
  ];
}

function lowRiskRepositoryDiffText(): string {
  return [
    'diff --git a/apps/law-prep-web/src/app/app.component.html b/apps/law-prep-web/src/app/app.component.html',
    '@@',
    '-<h1>Old copy</h1>',
    '+<h1>Updated copy</h1>',
    'diff --git a/apps/law-prep-web/src/app/app.component.scss b/apps/law-prep-web/src/app/app.component.scss',
    '@@',
    '-.hero { color: #333; }',
    '+.hero { color: #111; }'
  ].join('\n');
}
