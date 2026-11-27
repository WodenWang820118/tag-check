import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';

import {
  resolveWindowsPowerShellPath,
  resolveWindowsScriptPath
} from '../../../shared/process.ts';
import { runLocalCliCommand } from './local-cli.ts';

const WINDOWS_POWERSHELL =
  'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const WINDOWS_PWSH = 'C:\\Program Files\\PowerShell\\7\\pwsh.exe';

function pathsThatExist(
  paths: readonly string[]
): (targetPath: string) => boolean {
  const present = new Set(paths);
  return (targetPath) => present.has(targetPath);
}

test('runLocalCliCommand captures stdout, stderr, and status', () => {
  const result = runLocalCliCommand({
    command: process.execPath,
    args: ['-e', 'process.stdout.write("out"); process.stderr.write("err");']
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout, 'out');
  assert.equal(result.stderr, 'err');
  assert.equal(result.error, undefined);
});

test('runLocalCliCommand returns non-zero command results without throwing', () => {
  const result = runLocalCliCommand({
    command: process.execPath,
    args: ['-e', 'process.exit(7);']
  });

  assert.equal(result.status, 7);
  assert.equal(result.error, undefined);
});

test('runLocalCliCommand returns spawn errors for missing commands', () => {
  const result = runLocalCliCommand({
    command: 'definitely-missing-local-cli-command-for-spec',
    args: []
  });

  assert.equal(result.status, null);
  assert.equal(result.stdout, '');
  assert.equal(result.stderr, '');
  assert.equal(result.error instanceof Error, true);
});

test('Windows bridge resolvers return null on non-Windows platforms', () => {
  if (process.platform === 'win32') {
    assert.equal(typeof resolveWindowsPowerShellPath(), 'string');
    assert.doesNotThrow(() => resolveWindowsScriptPath('missing-script.ps1'));
    return;
  }

  assert.equal(resolveWindowsPowerShellPath(), null);
  assert.equal(resolveWindowsScriptPath('pnpm.ps1'), null);
});

test('Windows lookup checks PowerShell and script candidates in order', () => {
  assert.equal(
    resolveWindowsPowerShellPath({
      existsSync: pathsThatExist([WINDOWS_POWERSHELL, WINDOWS_PWSH]),
      platform: 'win32'
    }),
    WINDOWS_POWERSHELL
  );
  assert.equal(
    resolveWindowsPowerShellPath({
      existsSync: pathsThatExist([WINDOWS_PWSH]),
      platform: 'win32'
    }),
    WINDOWS_PWSH
  );

  const scriptName = 'copilot.ps1';
  const appDataRoot = 'C:\\Users\\me\\AppData\\Roaming';
  const nvmRoot = 'D:\\nvm\\v20';
  const appDataScript = join(appDataRoot, 'npm', scriptName);
  const nvmScript = join(nvmRoot, scriptName);
  const whereScript = join('C:\\elsewhere', scriptName);

  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: { APPDATA: appDataRoot, NVM_SYMLINK: nvmRoot },
      existsSync: pathsThatExist([appDataScript, nvmScript, whereScript]),
      platform: 'win32',
      spawnSync: () => {
        throw new Error('where.exe should not run when APPDATA\\npm exists');
      }
    }),
    appDataScript
  );
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: { APPDATA: appDataRoot, NVM_SYMLINK: nvmRoot },
      existsSync: pathsThatExist([nvmScript, whereScript]),
      platform: 'win32',
      spawnSync: () => {
        throw new Error('where.exe should not run when NVM_SYMLINK exists');
      }
    }),
    nvmScript
  );
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: { APPDATA: appDataRoot, NVM_SYMLINK: nvmRoot },
      existsSync: pathsThatExist([whereScript]),
      platform: 'win32',
      spawnSync: (command, args, options) => {
        assert.equal(command, 'where.exe');
        assert.equal(args.length, 1);
        assert.equal(args[0], scriptName);
        assert.equal(options.encoding, 'utf8');
        assert.deepEqual(options.stdio, ['ignore', 'pipe', 'pipe']);
        return {
          status: 0,
          stdout: `C:\\missing\\${scriptName}\r\n${whereScript}\r\n`
        };
      }
    }),
    whereScript
  );
});

test('Windows lookup returns null when the executable is missing', () => {
  assert.equal(
    resolveWindowsPowerShellPath({
      existsSync: () => false,
      platform: 'win32'
    }),
    null
  );
  assert.equal(
    resolveWindowsPowerShellPath({
      existsSync: () => {
        throw new Error('existsSync should not run off Windows');
      },
      platform: 'linux'
    }),
    null
  );

  const scriptName = 'missing-script.ps1';
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: {},
      existsSync: () => false,
      platform: 'win32',
      spawnSync: () => ({
        error: new Error('spawn where.exe ENOENT'),
        status: null,
        stdout: ''
      })
    }),
    null
  );
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: {},
      existsSync: () => false,
      platform: 'win32',
      spawnSync: () => ({ status: 1, stdout: '' })
    }),
    null
  );
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: { APPDATA: 'C:\\Users\\me\\AppData\\Roaming' },
      existsSync: () => false,
      platform: 'win32',
      spawnSync: () => ({
        status: 0,
        stdout: 'C:\\not-there\\missing-script.ps1\r\n'
      })
    }),
    null
  );
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: { APPDATA: 'C:\\Users\\me\\AppData\\Roaming' },
      existsSync: () => {
        throw new Error('existsSync should not run off Windows');
      },
      platform: 'darwin',
      spawnSync: () => {
        throw new Error('where.exe should not run off Windows');
      }
    }),
    null
  );
});

test('Windows lookup returns paths that contain spaces', () => {
  const scriptName = 'copilot.ps1';
  const appDataRoot = 'C:\\Users\\A B\\AppData\\Roaming';
  const appDataScript = join(appDataRoot, 'npm', scriptName);
  const whereScript = 'C:\\Program Files\\npm\\copilot.ps1';

  assert.equal(appDataScript.includes(' '), true);
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: { APPDATA: appDataRoot, NVM_SYMLINK: 'D:\\nvm\\v20' },
      existsSync: pathsThatExist([appDataScript]),
      platform: 'win32',
      spawnSync: () => {
        throw new Error('where.exe should not run when APPDATA\\npm exists');
      }
    }),
    appDataScript
  );
  assert.equal(
    resolveWindowsScriptPath(scriptName, {
      env: {},
      existsSync: pathsThatExist([whereScript]),
      platform: 'win32',
      spawnSync: () => ({
        status: 0,
        stdout: `  ${whereScript}  \r\n`
      })
    }),
    whereScript
  );
  assert.equal(
    resolveWindowsPowerShellPath({
      existsSync: pathsThatExist([WINDOWS_PWSH]),
      platform: 'win32'
    }),
    WINDOWS_PWSH
  );
});
