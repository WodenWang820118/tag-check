/// <reference types="node" />

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const workspaceRoot = resolve(
  fileURLToPath(new URL('../../../..', import.meta.url))
);

// Node and Nx by absolute path: no shell, no PATH lookup.
const buildResult = spawnSync(
  process.execPath,
  [
    resolve(workspaceRoot, 'node_modules/nx/dist/bin/nx.js'),
    'run',
    'nest-backend:build'
  ],
  { cwd: workspaceRoot, stdio: 'inherit' }
);

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
