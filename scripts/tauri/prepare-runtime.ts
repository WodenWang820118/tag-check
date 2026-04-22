import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDir, '..', '..');
const binariesDir = join(
  workspaceRoot,
  'apps',
  'desktop-tauri',
  'src-tauri',
  'binaries'
);
const backendDistDir = join(workspaceRoot, 'dist', 'apps', 'nest-backend');

export interface BackendRuntimeInstallPlan {
  fallbackCommand: 'install' | null;
  removeLockfileBeforeFallback: boolean;
  primaryCommand: 'ci' | 'install';
}

export interface PrepareBackendRuntimeDependencies {
  backendDir?: string;
  existsSyncFn?: typeof existsSync;
  removePathFn?: typeof rmIfExists;
  runFn?: typeof run;
  tryRunFn?: typeof tryRun;
  warnFn?: typeof console.warn;
}

export function getBackendRuntimeInstallPlan(
  hasPackageLock: boolean
): BackendRuntimeInstallPlan {
  if (hasPackageLock) {
    return {
      fallbackCommand: 'install',
      primaryCommand: 'ci',
      removeLockfileBeforeFallback: true
    };
  }

  return {
    fallbackCommand: null,
    primaryCommand: 'install',
    removeLockfileBeforeFallback: false
  };
}

export function main() {
  run(
    process.execPath,
    [resolveNxEntrypoint(), 'build', 'nest-backend'],
    workspaceRoot
  );
  stopExistingDesktopSidecars();
  prepareNodeSidecar();
  prepareBackendRuntime();
}

export function prepareBackendRuntime(
  dependencies: PrepareBackendRuntimeDependencies = {}
) {
  const backendDir = dependencies.backendDir ?? backendDistDir;
  const existsSyncFn = dependencies.existsSyncFn ?? existsSync;
  const removePathFn = dependencies.removePathFn ?? rmIfExists;
  const runFn = dependencies.runFn ?? run;
  const tryRunFn = dependencies.tryRunFn ?? tryRun;
  const warnFn = dependencies.warnFn ?? console.warn;

  if (!existsSyncFn(join(backendDir, 'package.json'))) {
    throw new Error(
      `Missing generated backend package.json in ${backendDir}`
    );
  }

  const packageLockPath = join(backendDir, 'package-lock.json');
  removePathFn(join(backendDir, 'node_modules'));
  const installPlan = getBackendRuntimeInstallPlan(existsSyncFn(packageLockPath));
  const primaryArgs = [
    resolveNpmEntrypoint(),
    installPlan.primaryCommand,
    '--omit=dev'
  ];

  if (tryRunFn(process.execPath, primaryArgs, backendDir)) {
    return;
  }

  if (!installPlan.fallbackCommand) {
    throw new Error(
      `Command failed: ${process.execPath} ${primaryArgs.join(' ')}`
    );
  }

  removePathFn(join(backendDir, 'node_modules'));
  if (installPlan.removeLockfileBeforeFallback) {
    removePathFn(packageLockPath);
  }

  warnFn(
    `npm ci failed in ${backendDir}. Falling back to npm install to regenerate runtime dependencies.`
  );
  runFn(
    process.execPath,
    [resolveNpmEntrypoint(), installPlan.fallbackCommand, '--omit=dev'],
    backendDir
  );
}

function prepareNodeSidecar() {
  const targetTriple = getRustTargetTriple();
  const extension = process.platform === 'win32' ? '.exe' : '';
  const targetPath = join(binariesDir, `node-${targetTriple}${extension}`);

  mkdirSync(binariesDir, { recursive: true });

  for (const fileName of readdirSync(binariesDir)) {
    if (fileName.startsWith('node-')) {
      rmIfExists(join(binariesDir, fileName));
    }
  }

  copyFileSync(process.execPath, targetPath);
}

function stopExistingDesktopSidecars() {
  if (process.platform !== 'win32') {
    return;
  }

  const desktopNodePaths = [
    join(
      workspaceRoot,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'target',
      'debug',
      'node.exe'
    ),
    join(
      workspaceRoot,
      'apps',
      'desktop-tauri',
      'src-tauri',
      'target',
      'release',
      'node.exe'
    )
  ];

  const powerShellScript = [
    `$paths = @(${desktopNodePaths.map((path) => `'${path.replace(/'/g, "''")}'`).join(', ')})`,
    'Get-CimInstance Win32_Process -ErrorAction SilentlyContinue',
    '  | Where-Object { $_.ExecutablePath -and ($paths -contains $_.ExecutablePath) }',
    '  | ForEach-Object { try { Stop-Process -Id $_.ProcessId -Force -ErrorAction Stop } catch {} }'
  ].join('\n');

  runBestEffort(
    'powershell.exe',
    ['-NoProfile', '-Command', powerShellScript],
    workspaceRoot
  );
}

function getRustTargetTriple() {
  const preferred = spawnSync(
    'rustc',
    ['--print', 'host-tuple'],
    {
      cwd: workspaceRoot,
      encoding: 'utf8'
    }
  );

  if (preferred.status === 0) {
    return preferred.stdout.trim();
  }

  const fallback = spawnSync('rustc', ['-vV'], {
    cwd: workspaceRoot,
    encoding: 'utf8'
  });

  if (fallback.status !== 0) {
    throw new Error(
      fallback.stderr || 'Failed to determine the Rust target triple'
    );
  }

  const match = fallback.stdout.match(/^host:\s+(\S+)$/m);
  if (!match) {
    throw new Error('Unable to parse the Rust target triple from `rustc -vV`.');
  }

  return match[1];
}
function resolveNxEntrypoint() {
  return join(workspaceRoot, 'node_modules', 'nx', 'bin', 'nx.js');
}

function resolveNpmEntrypoint() {
  return join(
    dirname(process.execPath),
    'node_modules',
    'npm',
    'bin',
    'npm-cli.js'
  );
}

function rmIfExists(targetPath: string) {
  if (existsSync(targetPath)) {
    rmSync(targetPath, { force: true, recursive: true });
  }
}

function run(command: string, args: string[], cwd: string) {
  if (!tryRun(command, args, cwd)) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function tryRun(command: string, args: string[], cwd: string) {
  const result = spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: 'inherit'
  });

  return !result.error && result.status === 0;
}

function runBestEffort(command: string, args: string[], cwd: string) {
  spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: 'ignore'
  });
}

function isExecutedDirectly(moduleUrl: string) {
  const entrypoint = process.argv[1];
  if (!entrypoint) {
    return false;
  }

  return resolve(fileURLToPath(moduleUrl)) === resolve(entrypoint);
}

if (isExecutedDirectly(import.meta.url)) {
  main();
}
