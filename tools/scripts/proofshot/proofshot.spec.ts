import assert from 'node:assert/strict';
import { test } from 'vitest';

import {
  buildServeCommand,
  buildStartWebArgs,
  DEFAULT_PROOFSHOT_PORT,
  DEFAULT_PROOFSHOT_PROJECT,
  stripFlagWithValue
} from './proofshot.ts';

test('buildServeCommand uses the Nx serve target for supported projects', () => {
  assert.equal(
    buildServeCommand('ng-frontend', DEFAULT_PROOFSHOT_PORT),
    'pnpm nx run ng-frontend:serve:development --port 4200'
  );
});

test('buildStartWebArgs defaults to ng-frontend and injects run, port, and description', () => {
  const result = buildStartWebArgs([]);

  assert.equal(result.project, DEFAULT_PROOFSHOT_PROJECT);
  assert.equal(result.port, DEFAULT_PROOFSHOT_PORT);
  assert.equal(
    result.runCommand,
    'pnpm nx run ng-frontend:serve:development --port 4200'
  );
  assert.deepEqual(result.args, [
    'start',
    '--run',
    'pnpm nx run ng-frontend:serve:development --port 4200',
    '--port',
    '4200',
    '--description',
    'Tag Check browser verification (ng-frontend)'
  ]);
});

test('buildStartWebArgs supports project and port overrides', () => {
  const result = buildStartWebArgs([
    '--project',
    'ng-tag-build',
    '--port',
    '4300'
  ]);

  assert.equal(result.project, 'ng-tag-build');
  assert.equal(result.port, '4300');
  assert.equal(
    result.runCommand,
    'pnpm nx run ng-tag-build:serve:development --port 4300'
  );
  assert.deepEqual(result.args, [
    'start',
    '--run',
    'pnpm nx run ng-tag-build:serve:development --port 4300',
    '--description',
    'Tag Check browser verification (ng-tag-build)',
    '--port',
    '4300'
  ]);
});

test('buildStartWebArgs respects explicit run and description values', () => {
  const result = buildStartWebArgs([
    '--project',
    'ng-product-doc',
    '--run',
    'pnpm nx run custom-app:serve:development --port 4400',
    '--port',
    '4400',
    '--description',
    'Custom flow'
  ]);

  assert.equal(result.project, 'ng-product-doc');
  assert.equal(result.runCommand, null);
  assert.deepEqual(result.args, [
    'start',
    '--run',
    'pnpm nx run custom-app:serve:development --port 4400',
    '--port',
    '4400',
    '--description',
    'Custom flow'
  ]);
});

test('buildStartWebArgs rejects custom run commands without an explicit port', () => {
  assert.throws(
    () =>
      buildStartWebArgs([
        '--run',
        'pnpm nx run custom-app:serve:development --port 4400'
      ]),
    /require --port/i
  );
});

test('stripFlagWithValue removes custom proofshot flags before forwarding args', () => {
  assert.deepEqual(
    stripFlagWithValue(
      ['--project', 'ng-frontend', '--port', '4200', '--description', 'Flow'],
      '--project'
    ),
    ['--port', '4200', '--description', 'Flow']
  );
});
