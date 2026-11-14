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

describe('pre-commit affected task selection', () => {
  let tempDir = '';

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'nx-affected-tasks-'));
  });

  afterEach(() => {
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  function selectAffectedTasks(file: string): string[] {
    const graphFile = join(tempDir, 'affected-graph.json');
    execFileSync(
      process.execPath,
      [
        nxEntrypoint,
        'affected',
        '-t',
        'test,test-node',
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
