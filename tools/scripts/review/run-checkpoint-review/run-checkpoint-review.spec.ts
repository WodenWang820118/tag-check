import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, test } from 'node:test';

import {
  buildReviewPrompt,
  createCheckpointReviewTelemetryContext,
  createReviewExecution,
  executeReviewFlow,
  getReviewExecutionPlan,
  inferAutoReviewRisk,
  main,
  parseCliArgs,
  parseChangedFilesFromContext,
  type ReviewExecution
} from './run-checkpoint-review.ts';
import { createProviderObservationBucketKey } from '../provider-observability/provider-observability.ts';

// ── Fixtures ──────────────────────────────────────────────────────────────────

function execution(
  checkpoint: ReviewExecution['checkpoint'],
  provider: ReviewExecution['provider'],
  focus: string,
  model?: string
): ReviewExecution {
  return { checkpoint, provider, focus, model };
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

// ── CLI arg parsing ───────────────────────────────────────────────────────────

describe('CLI arg parsing', () => {
  test('reads all supported checkpoint review flags', () => {
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
});

// ── Changed-file parsing ──────────────────────────────────────────────────────

describe('changed-file parsing', () => {
  test('reads the bullet list under the changed files heading', () => {
    assert.deepEqual(
      parseChangedFilesFromContext(lowRiskImplementationContext()),
      [
        'apps/law-prep-web/src/app/app.component.html',
        'apps/law-prep-web/src/app/app.component.scss'
      ]
    );
  });

  test('normalizes Windows-style backslash paths', () => {
    assert.deepEqual(
      parseChangedFilesFromContext(
        [
          'Changed files:',
          '- .\\tools\\scripts\\review\\run-checkpoint-review\\run-checkpoint-review.ts',
          ''
        ].join('\n')
      ),
      ['tools/scripts/review/run-checkpoint-review/run-checkpoint-review.ts']
    );
  });
});

// ── Auto risk inference ───────────────────────────────────────────────────────

describe('auto risk inference', () => {
  describe('when the change touches high-risk surfaces', () => {
    test('marks review control-plane files as high risk', () => {
      assert.equal(
        inferAutoReviewRisk({
          checkpoint: 'implementation',
          context: [
            'Changed files:',
            '- tools/scripts/review/run-checkpoint-review/run-checkpoint-review.ts',
            '',
            'Notes:',
            '- Updates implementation routing.'
          ].join('\n'),
          focus: 'general'
        }),
        'high'
      );
    });

    test('marks review-gate control-plane files as high risk', () => {
      assert.equal(
        inferAutoReviewRisk({
          checkpoint: 'implementation',
          context: [
            'Changed files:',
            '- tools/scripts/review-gate/shared/shared.ts',
            '',
            'Notes:',
            '- Tightens review-gate path recognition.'
          ].join('\n'),
          focus: 'general'
        }),
        'high'
      );
    });

    test('marks review-gate state mutation entrypoints as high risk', () => {
      assert.equal(
        inferAutoReviewRisk({
          checkpoint: 'implementation',
          context: [
            'Changed files:',
            '- tools/scripts/review-gate/approve-pre-implementation/approve-pre-implementation.ts',
            '',
            'Notes:',
            '- Updates how review-gate approvals are written.'
          ].join('\n'),
          focus: 'general'
        }),
        'high'
      );
    });

    test('marks review-related package script changes as high risk', () => {
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

    test('marks root package.json as high risk even with generic wording', () => {
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

    test('marks auth-heavy context as high risk', () => {
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

    test('marks public-contract route changes as high risk', () => {
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

    test('marks plain api contract files as high risk', () => {
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

    test('marks agent config files as high risk', () => {
      assert.equal(
        inferAutoReviewRisk({
          checkpoint: 'implementation',
          context: ['Changed files:', '- .codex/config.toml', ''].join('\n'),
          focus: 'general'
        }),
        'high'
      );
    });

    test('marks absolute Windows control-plane paths as high risk', () => {
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

    test('marks reviewer and skill governance files as high risk', () => {
      assert.equal(
        inferAutoReviewRisk({
          checkpoint: 'implementation',
          context: [
            'Changed files:',
            '- .agents/reviewers/common-review-contract.toml',
            '',
            'Summary:',
            '- Tighten reviewer guidance.'
          ].join('\n'),
          focus: 'general'
        }),
        'high'
      );
    });

    test('marks access-control and env config changes as high risk', () => {
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

    test('marks Python subprocess and Java HTTP client surfaces as high risk', () => {
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

    test('marks permission policy changes as high risk', () => {
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

    test('marks a high-risk focus keyword as high risk regardless of file paths', () => {
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
  });

  describe('when the change is bounded at medium risk', () => {
    test('classifies sparse context without a changed-files section as medium', () => {
      assert.equal(
        inferAutoReviewRisk({
          checkpoint: 'implementation',
          context: 'Summary only with no changed files section.',
          focus: 'general'
        }),
        'medium'
      );
    });

    test('stays medium when the context file list does not match repo changes', () => {
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

    test('stays medium when the repo has untracked files', () => {
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

    test('stays medium when the diff contains sensitive keywords', () => {
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

    test('stays medium when a changed file lacks diff-header evidence', () => {
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

    test('stays medium for an empty repo diff', () => {
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

    test('stays medium when the diff does not mention the changed files', () => {
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

    test('stays medium for executable UI TypeScript files', () => {
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

    test('does not collapse nested package.json files into the root-manifest high-risk bucket', () => {
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

    test('stays medium when the changed-file list exceeds the low-risk cap', () => {
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

    test('stays medium when focus contains a low-risk block keyword', () => {
      assert.equal(
        inferAutoReviewRisk({
          checkpoint: 'implementation',
          context: lowRiskImplementationContext(),
          focus: 'architecture'
        }),
        'medium'
      );
    });

    test('stays medium for refactor-heavy context', () => {
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
  });

  describe('when the change qualifies for low risk', () => {
    test('classifies doc/style-only changes with Windows-normalized matching paths as low risk', () => {
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
  });
});

// ── Review execution plan ─────────────────────────────────────────────────────

describe('review execution plan', () => {
  describe('default provider order per checkpoint', () => {
    test('plan: Copilot Claude → Gemini → Codex', () => {
      assert.deepEqual(
        getReviewExecutionPlan({
          checkpoint: 'plan',
          context: lowRiskImplementationContext(),
          focus: 'general',
          provider: 'auto'
        }),
        [
          execution('plan', 'copilot', 'general', 'claude-sonnet-4.6'),
          execution('plan', 'gemini', 'general', 'gemini-3.5-flash-high'),
          execution('plan', 'codex', 'general')
        ]
      );
    });

    test('plan stays on the default order even when context looks low-risk', () => {
      assert.deepEqual(
        getReviewExecutionPlan({
          checkpoint: 'plan',
          context: lowRiskImplementationContext(),
          focus: 'general',
          provider: 'auto'
        }),
        [
          execution('plan', 'copilot', 'general', 'claude-sonnet-4.6'),
          execution('plan', 'gemini', 'general', 'gemini-3.5-flash-high'),
          execution('plan', 'codex', 'general')
        ]
      );
    });

    test('implementation without repo diff: Gemini Flash → Copilot Claude → Codex', () => {
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
            'gemini-3.5-flash-high'
          ),
          execution(
            'implementation',
            'copilot',
            'general',
            'claude-sonnet-4.6'
          ),
          execution('implementation', 'codex', 'general')
        ]
      );
    });

    test('test: Copilot Claude → Gemini → Codex', () => {
      assert.deepEqual(
        getReviewExecutionPlan({
          checkpoint: 'test',
          context: lowRiskImplementationContext(),
          focus: 'tests',
          provider: 'auto'
        }),
        [
          execution('test', 'copilot', 'tests', 'claude-sonnet-4.6'),
          execution('test', 'gemini', 'tests', 'gemini-3.5-flash-high'),
          execution('test', 'codex', 'tests')
        ]
      );
    });
  });

  describe('explicit provider override', () => {
    test('produces a single-entry plan when provider is pinned to copilot', () => {
      assert.deepEqual(
        getReviewExecutionPlan({
          checkpoint: 'pre-merge',
          context: lowRiskImplementationContext(),
          focus: 'general',
          provider: 'copilot'
        }),
        [execution('pre-merge', 'copilot', 'general', 'claude-sonnet-4.6')]
      );
    });

    test('honors explicit model flag when provider is pinned', () => {
      assert.deepEqual(
        getReviewExecutionPlan({
          checkpoint: 'test',
          context: lowRiskImplementationContext(),
          focus: 'tests',
          provider: 'copilot',
          model: 'claude-sonnet-4.6'
        }),
        [execution('test', 'copilot', 'tests', 'claude-sonnet-4.6')]
      );
    });
  });

  describe('low-risk Codex-first routing', () => {
    test('implementation: routes Codex → Gemini Flash → Copilot Claude when risk is low', () => {
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
            'gemini-3.5-flash-high'
          ),
          execution('implementation', 'copilot', 'general', 'claude-sonnet-4.6')
        ]
      );
    });

    test('pre-merge: routes Codex → Gemini → Copilot Claude when risk is low', () => {
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
          execution('pre-merge', 'gemini', 'general', 'gemini-3.5-flash-high'),
          execution('pre-merge', 'copilot', 'general', 'claude-sonnet-4.6')
        ]
      );
    });
  });

  describe('when risk is elevated the Codex-first path is bypassed', () => {
    test('implementation with high-risk changes uses the standard Gemini-first order', () => {
      const highRiskContext = [
        'Changed files:',
        '- package.json',
        '',
        'Summary:',
        '- Update review:implementation script routing.'
      ].join('\n');
      assert.deepEqual(
        getReviewExecutionPlan({
          checkpoint: 'implementation',
          context: highRiskContext,
          focus: 'general',
          provider: 'auto'
        }),
        [
          execution(
            'implementation',
            'gemini',
            'general',
            'gemini-3.5-flash-high'
          ),
          execution(
            'implementation',
            'copilot',
            'general',
            'claude-sonnet-4.6'
          ),
          execution('implementation', 'codex', 'general')
        ]
      );
    });

    test('implementation with contract-like route changes uses the standard order', () => {
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
            'gemini-3.5-flash-high'
          ),
          execution(
            'implementation',
            'copilot',
            'general',
            'claude-sonnet-4.6'
          ),
          execution('implementation', 'codex', 'general')
        ]
      );
    });

    test('implementation with API file changes uses the standard order', () => {
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
            'gemini-3.5-flash-high'
          ),
          execution(
            'implementation',
            'copilot',
            'general',
            'claude-sonnet-4.6'
          ),
          execution('implementation', 'codex', 'general')
        ]
      );
    });

    test('pre-merge with high-risk changes uses the standard order', () => {
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
          execution('pre-merge', 'gemini', 'general', 'gemini-3.5-flash-high'),
          execution('pre-merge', 'copilot', 'general', 'claude-sonnet-4.6'),
          execution('pre-merge', 'codex', 'general')
        ]
      );
    });
  });
});

// ── Review execution creation ─────────────────────────────────────────────────

describe('review execution creation', () => {
  test('applies provider-specific model defaults', () => {
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
        model: 'gemini-3.5-flash-high'
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
});

// ── Review prompt construction ────────────────────────────────────────────────

describe('review prompt construction', () => {
  test('includes checkpoint, focus, shared contract, and context body', () => {
    const prompt = buildReviewPrompt(
      {
        checkpoint: 'implementation',
        provider: 'gemini',
        focus: 'security',
        model: 'gemini-3.5-flash-high'
      },
      'Changed files: tools/scripts/review-gate/shared/shared.ts',
      { commonReviewContract: '# Common Review Contract\nUse P0-P3 findings.' }
    );
    assert.match(prompt, /Checkpoint: implementation/);
    assert.match(prompt, /Primary focus: security/);
    assert.match(prompt, /Shared review contract:/);
    assert.match(prompt, /Use P0-P3 findings/);
    assert.match(prompt, /Apply the shared review contract/);
    assert.match(
      prompt,
      /Changed files: tools\/scripts\/review-gate\/shared\/shared\.ts/
    );
  });
});

// ── Telemetry context ─────────────────────────────────────────────────────────

describe('telemetry context', () => {
  test('keeps checkpoint buckets distinct across plan and implementation', () => {
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
});

// ── Review flow execution ─────────────────────────────────────────────────────

describe('review flow execution', () => {
  function noDeps(): Parameters<typeof executeReviewFlow>[1] {
    return {
      cacheUnavailable() {
        return undefined;
      },
      log() {
        return undefined;
      },
      async probe() {
        return { available: true };
      },
      async run(e) {
        return e.provider;
      }
    };
  }

  describe('explicit provider routing', () => {
    test('fails fast when the pinned provider is unavailable', async () => {
      await assert.rejects(
        executeReviewFlow(
          {
            checkpoint: 'plan',
            context: 'smoke',
            focus: 'general',
            provider: 'gemini'
          },
          {
            ...noDeps(),
            async probe() {
              return { available: false, reason: 'quota exhausted' };
            }
          }
        ),
        /Antigravity CLI review is unavailable: quota exhausted/
      );
    });
  });

  describe('auto routing for test checkpoints', () => {
    test('probes Copilot first then falls through to Gemini when Copilot is unavailable', async () => {
      const probed: string[] = [];
      const output = await executeReviewFlow(
        {
          checkpoint: 'test',
          context: 'smoke',
          focus: 'tests',
          provider: 'auto'
        },
        {
          ...noDeps(),
          async probe(e) {
            probed.push(`${e.provider}:${e.model ?? '<none>'}`);
            return e.model === 'claude-sonnet-4.6'
              ? { available: false, reason: 'quota exhausted' }
              : { available: true };
          },
          async run(e) {
            return e.model ?? e.provider;
          }
        }
      );
      assert.deepEqual(probed, [
        'copilot:claude-sonnet-4.6',
        'gemini:gemini-3.5-flash-high'
      ]);
      assert.equal(output, 'gemini-3.5-flash-high');
    });

    test('falls back to Codex after Copilot and Gemini both fail', async () => {
      const probed: string[] = [];
      const output = await executeReviewFlow(
        {
          checkpoint: 'test',
          context: 'smoke',
          focus: 'tests',
          provider: 'auto'
        },
        {
          ...noDeps(),
          async probe(e) {
            probed.push(`${e.provider}:${e.model ?? '<none>'}`);
            return e.provider === 'copilot' || e.provider === 'gemini'
              ? { available: false, reason: 'quota exhausted' }
              : { available: true };
          },
          async run(e) {
            return e.provider;
          }
        }
      );
      assert.deepEqual(probed, [
        'copilot:claude-sonnet-4.6',
        'gemini:gemini-3.5-flash-high',
        'codex:<none>'
      ]);
      assert.equal(output, 'codex');
    });
  });

  describe('provider fallback on retryable runtime errors', () => {
    test('retries the next provider and caches the failure', async () => {
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
          ...noDeps(),
          cacheUnavailable(e, error) {
            cached.push({
              provider: e.provider,
              reason: error instanceof Error ? error.message : String(error)
            });
          },
          async run(e) {
            ran.push(e.provider);
            if (e.provider === 'gemini')
              throw new Error('MODEL_CAPACITY_EXHAUSTED');
            return e.provider;
          }
        }
      );
      assert.equal(output, 'copilot');
      assert.deepEqual(ran, ['gemini', 'copilot']);
      assert.deepEqual(cached, [
        { provider: 'gemini', reason: 'MODEL_CAPACITY_EXHAUSTED' }
      ]);
    });
  });

  describe('Codex-first path for low-risk reviews', () => {
    test('probes and runs Codex first for low-risk implementation reviews', async () => {
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
          ...noDeps(),
          async probe(e) {
            probed.push(`${e.provider}:${e.model ?? '<none>'}`);
            return { available: true };
          },
          async run(e) {
            ran.push(`${e.provider}:${e.model ?? '<none>'}`);
            return e.provider;
          }
        }
      );
      assert.deepEqual(probed, ['codex:<none>']);
      assert.deepEqual(ran, ['codex:<none>']);
      assert.equal(output, 'codex');
    });

    test('falls back from Codex to Gemini Flash when Codex fails retryably', async () => {
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
          ...noDeps(),
          async run(e) {
            ran.push(`${e.provider}:${e.model ?? '<none>'}`);
            if (e.provider === 'codex')
              throw new Error('subscription required');
            return e.provider;
          }
        }
      );
      assert.deepEqual(ran, ['codex:<none>', 'gemini:gemini-3.5-flash-high']);
      assert.equal(output, 'gemini');
    });

    test('probes and runs Codex first for low-risk pre-merge reviews', async () => {
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
          ...noDeps(),
          async probe(e) {
            probed.push(`${e.provider}:${e.model ?? '<none>'}`);
            return { available: true };
          },
          async run(e) {
            ran.push(`${e.provider}:${e.model ?? '<none>'}`);
            return e.provider;
          }
        }
      );
      assert.deepEqual(probed, ['codex:<none>']);
      assert.deepEqual(ran, ['codex:<none>']);
      assert.equal(output, 'codex');
    });
  });

  describe('when all auto-routed providers are exhausted', () => {
    test('reports each attempted provider and its failure reason', async () => {
      await assert.rejects(
        executeReviewFlow(
          {
            checkpoint: 'plan',
            context: 'smoke',
            focus: 'general',
            provider: 'auto'
          },
          {
            ...noDeps(),
            async probe(e) {
              return { available: false, reason: `${e.provider} down` };
            }
          }
        ),
        /Attempted providers:[\s\S]*copilot:claude-sonnet-4\.6: copilot down[\s\S]*gemini:gemini-3\.5-flash-high: gemini down[\s\S]*codex: codex down/
      );
    });
  });
});

// ── Characterization: pinned providers, errors, paths, prompt, entrypoint ────

describe('pinned provider plans', () => {
  test('copilot without --model uses only the default Claude model', () => {
    assert.deepEqual(
      getReviewExecutionPlan({
        checkpoint: 'plan',
        focus: 'general',
        provider: 'copilot'
      }),
      [execution('plan', 'copilot', 'general', 'claude-sonnet-4.6')]
    );
  });

  test('copilot, gemini and codex honour --model with no fallback', () => {
    assert.deepEqual(
      getReviewExecutionPlan({
        checkpoint: 'test',
        focus: 'tests',
        model: 'custom-model',
        provider: 'copilot'
      }),
      [execution('test', 'copilot', 'tests', 'custom-model')]
    );
    assert.deepEqual(
      getReviewExecutionPlan({
        checkpoint: 'test',
        focus: 'tests',
        provider: 'gemini'
      }),
      [execution('test', 'gemini', 'tests', 'gemini-3.5-flash-high')]
    );
    assert.deepEqual(
      getReviewExecutionPlan({
        checkpoint: 'test',
        focus: 'tests',
        model: 'gpt-5.4',
        provider: 'codex'
      }),
      [execution('test', 'codex', 'tests', 'gpt-5.4')]
    );
  });

  test('auto ignores --model', () => {
    assert.deepEqual(
      getReviewExecutionPlan({
        checkpoint: 'plan',
        focus: 'general',
        model: 'ignored',
        provider: 'auto'
      }).map((entry) => entry.model),
      ['claude-sonnet-4.6', 'gemini-3.5-flash-high', undefined]
    );
  });
});

describe('CLI arg errors', () => {
  test('uses the documented error messages', () => {
    assert.deepEqual(parseCliArgs([]), { provider: 'auto', focus: 'general' });
    assert.throws(
      () => parseCliArgs(['--bogus']),
      /^Error: Unknown review flag: --bogus$/
    );
    assert.throws(
      () => parseCliArgs(['--focus']),
      /^Error: Missing value for --focus\.$/
    );
    assert.throws(
      () => parseCliArgs(['--model']),
      /^Error: Missing value for --model\.$/
    );
    assert.throws(
      () => parseCliArgs(['--context-file']),
      /^Error: Missing value for --context-file\.$/
    );
    assert.throws(
      () => parseCliArgs(['--checkpoint', 'nope']),
      /^Error: Unsupported checkpoint "nope"\. Expected one of: plan, implementation, test, pre-merge\.$/
    );
    assert.throws(
      () => parseCliArgs(['--checkpoint']),
      /^Error: Unsupported checkpoint "". Expected one of: plan, implementation, test, pre-merge\.$/
    );
    assert.throws(
      () => parseCliArgs(['--provider', 'x']),
      /^Error: Unsupported provider "x"\. Expected one of: auto, copilot, gemini, codex\.$/
    );
  });
});

describe('changed-file path normalization', () => {
  test('anchors absolute and Windows paths at the workspace folders', () => {
    const parse = (path: string) =>
      parseChangedFilesFromContext(`Changed files:\n- ${path}\n`);
    assert.deepEqual(parse('C:\\work\\repo\\apps\\web\\a.html'), [
      'apps/web/a.html'
    ]);
    assert.deepEqual(parse('/home/me/repo/tools/scripts/x.ts'), [
      'tools/scripts/x.ts'
    ]);
    assert.deepEqual(parse('/home/me/repo/AGENTS.md'), ['AGENTS.md']);
    assert.deepEqual(parse('/home/me/repo/.github/ci.yml'), ['.github/ci.yml']);
    assert.deepEqual(parse('some/where/docs/a.md'), ['docs/a.md']);
    // Bare (non-slash) anchors match anywhere in the path.
    assert.deepEqual(parse('pkg/myscripts/a.ts'), ['scripts/a.ts']);
    assert.deepEqual(parse('src/other/a.ts'), ['src/other/a.ts']);
  });

  test('stops at the first non-bullet line and ignores other sections', () => {
    assert.deepEqual(
      parseChangedFilesFromContext(
        'Changed files:\n- a.md\n* b.md\nnot a bullet\n- c.md'
      ),
      ['a.md', 'b.md']
    );
    assert.deepEqual(parseChangedFilesFromContext('- a.md'), []);
  });
});

describe('review prompt variants', () => {
  const base = { provider: 'codex', focus: 'general' } as const;

  test('builds the exact prompt without a shared contract', () => {
    assert.equal(
      buildReviewPrompt({ ...base, checkpoint: 'plan' }, '  body  ', {
        commonReviewContract: '   '
      }),
      [
        'You are the second-opinion reviewer for this repository.',
        'Checkpoint: plan',
        'Primary focus: general',
        'Review rules:',
        '- Apply the shared review contract for severity labels, findings, verdict, and residual-risk format',
        '- Call out correctness, security risk, workflow violations, contract drift, and missing tests',
        'Context to review:',
        'body'
      ].join('\n')
    );
  });

  test('adds checkpoint-specific rules and the requested model', () => {
    const testPrompt = buildReviewPrompt(
      { ...base, checkpoint: 'test', model: 'm1' },
      'ctx',
      { commonReviewContract: 'C' }
    );
    assert.match(testPrompt, /Requested model: m1/);
    assert.match(testPrompt, /Shared review contract:\nC\n/);
    assert.match(testPrompt, /- Focus on missing scenarios/);
    assert.doesNotMatch(testPrompt, /escalated to Copilot/);
    const implementationPrompt = buildReviewPrompt(
      { ...base, checkpoint: 'implementation' },
      'ctx',
      { commonReviewContract: 'C' }
    );
    assert.match(implementationPrompt, /escalated to Copilot/);
    assert.doesNotMatch(implementationPrompt, /Requested model/);
  });
});

describe('review flow error handling', () => {
  const deps = (
    overrides: Partial<Parameters<typeof executeReviewFlow>[1]> = {}
  ): Parameters<typeof executeReviewFlow>[1] => ({
    cacheUnavailable() {
      return undefined;
    },
    log() {
      return undefined;
    },
    async probe() {
      return { available: true };
    },
    async run(e) {
      return e.provider;
    },
    ...overrides
  });

  test('rethrows non-retryable errors without trying the next provider', async () => {
    const ran: string[] = [];
    await assert.rejects(
      executeReviewFlow(
        { checkpoint: 'plan', context: 'c', focus: 'g', provider: 'auto' },
        deps({
          async run(e) {
            ran.push(e.provider);
            throw new Error('boom');
          }
        })
      ),
      /^Error: boom$/
    );
    assert.deepEqual(ran, ['copilot']);
  });

  test('a pinned provider never falls back, even on a retryable error', async () => {
    const cached: string[] = [];
    await assert.rejects(
      executeReviewFlow(
        { checkpoint: 'plan', context: 'c', focus: 'g', provider: 'gemini' },
        deps({
          cacheUnavailable(e) {
            cached.push(e.provider);
          },
          async run() {
            throw new Error('MODEL_CAPACITY_EXHAUSTED');
          }
        })
      ),
      /MODEL_CAPACITY_EXHAUSTED/
    );
    assert.deepEqual(cached, []);
  });

  test('uses the default unavailable reason for a pinned provider', async () => {
    const unavailable = deps({
      async probe() {
        return { available: false };
      }
    });
    await assert.rejects(
      executeReviewFlow(
        { checkpoint: 'plan', context: 'c', focus: 'g', provider: 'codex' },
        unavailable
      ),
      /^Error: Codex reviewer review is unavailable: health check failed\.$/
    );
    await assert.rejects(
      executeReviewFlow(
        { checkpoint: 'plan', context: 'c', focus: 'g', provider: 'copilot' },
        unavailable
      ),
      /^Error: Copilot CLI review is unavailable: health check failed\.$/
    );
  });

  test('logs and records each skipped auto provider', async () => {
    const logs: string[] = [];
    await assert.rejects(
      executeReviewFlow(
        { checkpoint: 'test', context: 'c', focus: 'g', provider: 'auto' },
        deps({
          log(message) {
            logs.push(message);
          },
          async probe() {
            return { available: false };
          }
        })
      ),
      /No review provider was available for this checkpoint\.\nAttempted providers:\n- copilot:claude-sonnet-4\.6: unavailable\n- gemini:gemini-3\.5-flash-high: unavailable\n- codex: unavailable$/
    );
    assert.deepEqual(logs, [
      'Copilot CLI (claude-sonnet-4.6) review is unavailable: health check failed.',
      'Antigravity CLI (gemini-3.5-flash-high) review is unavailable: health check failed.',
      'Codex reviewer review is unavailable: health check failed.'
    ]);
  });

  test('logs when a provider becomes unavailable during execution', async () => {
    const logs: string[] = [];
    await executeReviewFlow(
      { checkpoint: 'plan', context: 'c', focus: 'g', provider: 'auto' },
      deps({
        log(message) {
          logs.push(message);
        },
        async run(e) {
          if (e.provider === 'copilot') throw new Error('rate limit exceeded');
          return e.provider;
        }
      })
    );
    assert.deepEqual(logs, [
      'Copilot CLI (claude-sonnet-4.6) review became unavailable during execution. Trying the next fallback.'
    ]);
  });
});

describe('main input handling', () => {
  test('requires --checkpoint', async () => {
    await assert.rejects(
      main([]),
      /^Error: Missing --checkpoint\. Expected one of: plan, implementation, test, pre-merge\.$/
    );
  });

  test('reports a missing context file by its resolved path', async () => {
    await assert.rejects(
      main(['--checkpoint', 'plan', '--context-file', 'no-such-context.md']),
      /^Error: Context file not found: .*no-such-context\.md$/
    );
  });

  test('rejects a blank context file', async () => {
    const dir = mkdtempSync(join(process.cwd(), '.tmp-checkpoint-review-'));
    try {
      const file = join(dir, 'blank.md');
      writeFileSync(file, '  \n');
      await assert.rejects(
        main(['--checkpoint', 'plan', '--context-file', file]),
        /^Error: Review context is required\. Pass --context-file <path> or pipe the review context via stdin\.$/
      );
    } finally {
      rmSync(dir, { force: true, recursive: true });
    }
  });
});

describe('entrypoint process', () => {
  const entrypoint = fileURLToPath(
    new URL('./run-checkpoint-review.ts', import.meta.url)
  );
  const run = (args: string[], input?: string) =>
    spawnSync(process.execPath, [entrypoint, ...args], {
      encoding: 'utf8',
      input
    });

  test('exits 1 and prints only the message for a bad flag', () => {
    const result = run(['--bogus']);
    assert.equal(result.status, 1);
    assert.equal(result.stderr, 'Unknown review flag: --bogus\n');
    assert.equal(result.stdout, '');
  });

  test('reads the review context from stdin and rejects blank input', () => {
    const result = run(['--checkpoint', 'plan'], '   \n');
    assert.equal(result.status, 1);
    assert.equal(
      result.stderr,
      'Review context is required. Pass --context-file <path> or pipe the review context via stdin.\n'
    );
  });
});
