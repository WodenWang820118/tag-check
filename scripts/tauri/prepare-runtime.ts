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

run(
  process.execPath,
  [resolveNxEntrypoint(), 'build', 'nest-backend'],
  workspaceRoot
);
stopExistingDesktopSidecars();
prepareNodeSidecar();
prepareBackendRuntime();

function prepareBackendRuntime() {
  if (!existsSync(join(backendDistDir, 'package.json'))) {
    throw new Error(
      `Missing generated backend package.json in ${backendDistDir}`
    );
  }

  rmIfExists(join(backendDistDir, 'node_modules'));
  rmIfExists(join(backendDistDir, 'package-lock.json'));

  run(
    process.execPath,
    [resolveNpmEntrypoint(), 'install', '--omit=dev'],
    backendDistDir
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
    resolveCommand('rustc'),
    ['--print', 'host-tuple'],
    {
      cwd: workspaceRoot,
      encoding: 'utf8'
    }
  );

  if (preferred.status === 0) {
    return preferred.stdout.trim();
  }

  const fallback = spawnSync(resolveCommand('rustc'), ['-vV'], {
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

function resolveCommand(command: string) {
  if (process.platform !== 'win32') {
    return command;
  }

  return command;
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
  const result = spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(' ')}`);
  }
}

function runBestEffort(command: string, args: string[], cwd: string) {
  spawnSync(command, args, {
    cwd,
    shell: false,
    stdio: 'ignore'
  });
}
