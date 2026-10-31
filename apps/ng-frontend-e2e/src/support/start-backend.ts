/// <reference types="node" />

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(
  fileURLToPath(new URL('../../../..', import.meta.url))
);

const buildResult = spawnSync('pnpm exec nx run nest-backend:build', {
  cwd: workspaceRoot,
  shell: true,
  stdio: 'inherit'
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const dataFolder = resolve(
  workspaceRoot,
  'dist/.playwright/apps/ng-frontend-e2e/backend-data'
);

rmSync(dataFolder, { recursive: true, force: true });
mkdirSync(dataFolder, { recursive: true });

const backendScript = resolve(workspaceRoot, 'dist/apps/nest-backend/main.js');

const child = spawn(process.execPath, [backendScript], {
  cwd: dataFolder,
  env: {
    ...process.env,
    NODE_ENV: 'dev',
    PORT: '7070'
  },
  stdio: 'inherit'
});

const forwardSignal = (signal: NodeJS.Signals): void => {
  if (child.pid && !child.killed) {
    child.kill(signal);
  }
};

process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 0);
});
