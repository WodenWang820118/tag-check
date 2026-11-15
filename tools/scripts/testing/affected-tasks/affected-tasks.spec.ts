import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  resolveNxEntrypoint,
  workspaceRoot
} from '../../tauri/path-contract/path-contract.ts';

interface AffectedGraphOutput {
  tasks?: Record<string, unknown>;
}

const nxEntrypoint = resolveNxEntrypoint(workspaceRoot);
const NX_CALL_TIMEOUT_MS = 60_000;
const CI_TARGETS = 'lint,typecheck-spec,typecheck-tools';

describe('affected task selection', () => {
  let tempDir = '';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'nx-affected-tasks-'));
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function selectAffectedTasks(
    file: string,
    targets = 'test,test-node'
  ): string[] {
    const graphFile = join(tempDir, 'affected-graph.json');
    execFileSync(
      process.execPath,
      [
        nxEntrypoint,
        'affected',
        '-t',
        targets,
        `--files=${file}`,
        `--graph=${graphFile}`
      ],
      {
        cwd: workspaceRoot,
        env: { ...process.env, NX_DAEMON: 'false' },
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );

    const parsed = JSON.parse(
      readFileSync(graphFile, 'utf8')
    ) as AffectedGraphOutput;
    const tasksSection = parsed.tasks;
    const taskMap =
      tasksSection &&
      typeof tasksSection === 'object' &&
      'tasks' in tasksSection &&
      'dependencies' in tasksSection &&
      tasksSection.tasks &&
      typeof tasksSection.tasks === 'object'
        ? (tasksSection.tasks as Record<string, unknown>)
        : tasksSection;

    return Object.keys(taskMap ?? {}).sort();
  }

  function listProjectsWithTarget(target: string): string[] {
    const stdout = execFileSync(
      process.execPath,
      [nxEntrypoint, 'show', 'projects', `--with-target=${target}`, '--json'],
      {
        cwd: workspaceRoot,
        env: { ...process.env, NX_DAEMON: 'false' },
        encoding: 'utf8',
        stdio: 'pipe'
      }
    );

    return JSON.parse(stdout) as string[];
  }

  describe('pre-commit affected task selection', () => {
    it(
      'selects no tasks for documentation files',
      () => {
        expect(selectAffectedTasks('README.md')).toEqual([]);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects only utils:test when only a utils spec changes',
      () => {
        expect(
          selectAffectedTasks(
            'libs/utils/src/lib/dtos/event-inspect-preset.dto.spec.ts'
          )
        ).toEqual(['utils:test']);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects utils:test and dependant tests when libs/utils/src/index.ts changes',
      () => {
        const tasks = selectAffectedTasks('libs/utils/src/index.ts');

        expect(tasks).toEqual(
          expect.arrayContaining([
            'data-access:test',
            'nest-backend:test',
            'ng-frontend:test',
            'ng-gtm-sample:test',
            'ng-product-doc:test',
            'ng-tag-build:test',
            'ui:test',
            'utils:test'
          ])
        );
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects only the backend unit test target when backend source changes',
      () => {
        expect(selectAffectedTasks('apps/nest-backend/src/main.ts')).toEqual([
          'nest-backend:test'
        ]);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects only the tool test targets when a tool script changes',
      () => {
        expect(
          selectAffectedTasks('tools/scripts/tauri/release/release.ts')
        ).toEqual(['tools-scripts:test', 'tools-scripts:test-node']);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects only the tasks that read root vitest.config.ts',
      () => {
        expect(selectAffectedTasks('vitest.config.ts')).toEqual([
          'tools-scripts:test'
        ]);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects only tools-scripts:test when VERSION changes',
      () => {
        expect(selectAffectedTasks('VERSION')).toEqual(['tools-scripts:test']);
      },
      NX_CALL_TIMEOUT_MS
    );
  });

  describe('CI affected task selection (lint, typecheck-spec, typecheck-tools)', () => {
    it(
      'selects no tasks for documentation files',
      () => {
        expect(selectAffectedTasks('README.md', CI_TARGETS)).toEqual([]);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects utils:lint and dependant typecheck-spec tasks when libs/utils/src/index.ts changes',
      () => {
        const tasks = selectAffectedTasks(
          'libs/utils/src/index.ts',
          CI_TARGETS
        );

        expect(tasks).toEqual(
          expect.arrayContaining([
            'utils:lint',
            'utils:typecheck-spec',
            'ng-frontend:lint',
            'ng-frontend:typecheck-spec',
            'tools-scripts:typecheck-tools'
          ])
        );
        // shared-styles and ui-helm do not depend on utils.
        expect(
          tasks.filter(
            (task) =>
              task.startsWith('shared-styles:') || task.startsWith('ui-helm:')
          )
        ).toEqual([]);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects only the application and its e2e project when an application source changes',
      () => {
        expect(
          selectAffectedTasks('apps/ng-frontend/src/main.ts', CI_TARGETS)
        ).toEqual([
          'ng-frontend-e2e:lint',
          'ng-frontend:lint',
          'ng-frontend:typecheck-spec'
        ]);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects tools-scripts:typecheck-tools and no application task when a tool script changes',
      () => {
        const tasks = selectAffectedTasks(
          'tools/scripts/tauri/release/release.ts',
          CI_TARGETS
        );

        expect(tasks).toEqual([
          'tools-scripts:lint',
          'tools-scripts:typecheck-tools'
        ]);
      },
      NX_CALL_TIMEOUT_MS
    );

    it(
      'selects the lint task of every project with a lint target when .oxlintrc.json changes',
      () => {
        const expectedLintTasks = listProjectsWithTarget('lint')
          .map((project) => `${project}:lint`)
          .sort();

        expect(expectedLintTasks.length).toBeGreaterThan(0);
        expect(selectAffectedTasks('.oxlintrc.json', CI_TARGETS)).toEqual(
          expectedLintTasks
        );
      },
      NX_CALL_TIMEOUT_MS
    );
  });
});
