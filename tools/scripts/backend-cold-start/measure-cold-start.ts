import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { argv, exit, stdout } from 'node:process';

import { isDirectEntrypoint } from '../shared/paths.ts';

interface StartupTimingPayload {
  schema: 'startup-timing/v1';
  nodeEnv: string;
  pid: number;
  processUptimeAtBootstrapEnterMs: number;
  moduleEvalToImportsDoneMs: number;
  importsDoneToBootstrapEnterMs: number;
  bootstrapEnterToNestCreateMs: number;
  nestCreateToListenMs: number;
  totalBootstrapMs: number;
  totalSinceModuleEvalMs: number;
  port: number | string;
  timestamp: string;
}

interface RunResult extends StartupTimingPayload {
  wallClockToTimingLineMs: number;
}

interface MeasureOptions {
  bundlePath: string;
  warmupRuns: number;
  measuredRuns: number;
  startPort: number;
  spawnTimeoutMs: number;
  freshDbPerRun: boolean;
  compileCacheDir: string | null;
}

const NUMERIC_FIELDS = [
  'processUptimeAtBootstrapEnterMs',
  'moduleEvalToImportsDoneMs',
  'importsDoneToBootstrapEnterMs',
  'bootstrapEnterToNestCreateMs',
  'nestCreateToListenMs',
  'totalBootstrapMs',
  'totalSinceModuleEvalMs',
  'wallClockToTimingLineMs'
] as const satisfies ReadonlyArray<keyof RunResult>;

type NumericField = (typeof NUMERIC_FIELDS)[number];

function median(values: number[]): number {
  if (values.length === 0) {
    return Number.NaN;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function parseArgs(args: string[]): MeasureOptions {
  const opts: MeasureOptions = {
    bundlePath: resolve('dist/apps/nest-backend/main.js'),
    warmupRuns: 1,
    measuredRuns: 5,
    startPort: 7100,
    spawnTimeoutMs: 60_000,
    freshDbPerRun: false,
    compileCacheDir: null
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];
    switch (arg) {
      case '--bundle':
        opts.bundlePath = resolve(next);
        i++;
        break;
      case '--warmup':
        opts.warmupRuns = Number.parseInt(next, 10);
        i++;
        break;
      case '--runs':
        opts.measuredRuns = Number.parseInt(next, 10);
        i++;
        break;
      case '--port':
        opts.startPort = Number.parseInt(next, 10);
        i++;
        break;
      case '--timeout':
        opts.spawnTimeoutMs = Number.parseInt(next, 10);
        i++;
        break;
      case '--fresh-db':
        opts.freshDbPerRun = true;
        break;
      case '--compile-cache':
        opts.compileCacheDir = resolve(next);
        i++;
        break;
      case '--compile-cache-tmp':
        opts.compileCacheDir = mkdtempSync(
          join(tmpdir(), 'tagcheck-coldstart-cache-')
        );
        break;
      default:
        // ignore unknown
        break;
    }
  }
  return opts;
}

async function runOnce(
  bundlePath: string,
  port: number,
  rootProjectPath: string,
  timeoutMs: number,
  compileCacheDir: string | null
): Promise<RunResult> {
  return await new Promise<RunResult>((resolvePromise, rejectPromise) => {
    const databasePath = join(rootProjectPath, '.db', 'data.sqlite3');
    const startupLogPath = join(rootProjectPath, `startup-timing-${port}.log`);
    const wallClockStart = performance.now();

    const env: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: 'prod',
      PORT: String(port),
      DATABASE_PATH: databasePath,
      ROOT_PROJECT_PATH: rootProjectPath,
      STARTUP_TIMING_LOG: startupLogPath
    };
    if (compileCacheDir) {
      env.NODE_COMPILE_CACHE = compileCacheDir;
    } else {
      // Explicitly clear it so a stray env doesn't bleed into the experiment.
      delete env.NODE_COMPILE_CACHE;
    }

    const child = spawn(process.execPath, [bundlePath], {
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let stdoutBuffer = '';
    let stderrBuffer = '';
    let resolved = false;
    const timeoutHandle = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      child.kill('SIGKILL');
      rejectPromise(
        new Error(
          `Backend did not emit STARTUP_TIMING within ${timeoutMs}ms.\nstderr:\n${stderrBuffer}\nstdout:\n${stdoutBuffer}`
        )
      );
    }, timeoutMs);

    function tryParseTiming(buffer: string): StartupTimingPayload | null {
      const lines = buffer.split(/\r?\n/);
      for (const line of lines) {
        const idx = line.indexOf('STARTUP_TIMING ');
        if (idx === -1) continue;
        const jsonText = line.slice(idx + 'STARTUP_TIMING '.length).trim();
        try {
          return JSON.parse(jsonText) as StartupTimingPayload;
        } catch {
          // partial line, keep waiting
        }
      }
      return null;
    }

    child.stdout.on('data', (chunk: Buffer) => {
      stdoutBuffer += chunk.toString('utf-8');
      if (resolved) return;
      const timing = tryParseTiming(stdoutBuffer);
      if (timing) {
        resolved = true;
        const wallClockToTimingLineMs = performance.now() - wallClockStart;
        clearTimeout(timeoutHandle);
        child.kill('SIGKILL');
        resolvePromise({ ...timing, wallClockToTimingLineMs });
      }
    });

    child.stderr.on('data', (chunk: Buffer) => {
      stderrBuffer += chunk.toString('utf-8');
    });

    child.on('error', (error) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutHandle);
      rejectPromise(error);
    });

    child.on('exit', (code, signal) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timeoutHandle);
      rejectPromise(
        new Error(
          `Backend exited before STARTUP_TIMING emitted (code=${code}, signal=${signal}).\nstderr:\n${stderrBuffer}\nstdout:\n${stdoutBuffer}`
        )
      );
    });
  });
}

function summarize(results: RunResult[]): Record<NumericField, number> {
  const summary = {} as Record<NumericField, number>;
  for (const field of NUMERIC_FIELDS) {
    summary[field] = median(results.map((r) => r[field]));
  }
  return summary;
}

function formatRow(label: string, value: number): string {
  return `  ${label.padEnd(40)} ${value.toFixed(1).padStart(10)} ms`;
}

export async function measureColdStart(
  options: MeasureOptions
): Promise<{ runs: RunResult[]; medians: Record<NumericField, number> }> {
  const sessionTmpRoot = mkdtempSync(join(tmpdir(), 'tagcheck-coldstart-'));
  const tmpRootsToCleanup: string[] = [sessionTmpRoot];
  function makeRunRoot(): string {
    if (!options.freshDbPerRun) {
      return sessionTmpRoot;
    }
    const root = mkdtempSync(join(tmpdir(), 'tagcheck-coldstart-run-'));
    mkdirSync(join(root, '.db'), { recursive: true });
    tmpRootsToCleanup.push(root);
    return root;
  }
  mkdirSync(join(sessionTmpRoot, '.db'), { recursive: true });
  try {
    let port = options.startPort;
    for (let i = 0; i < options.warmupRuns; i++) {
      const root = makeRunRoot();
      stdout.write(
        `Warmup run ${i + 1}/${options.warmupRuns} on port ${port} (root=${root})...\n`
      );
      await runOnce(
        options.bundlePath,
        port,
        root,
        options.spawnTimeoutMs,
        options.compileCacheDir
      );
      port++;
    }
    const results: RunResult[] = [];
    for (let i = 0; i < options.measuredRuns; i++) {
      const root = makeRunRoot();
      stdout.write(
        `Measured run ${i + 1}/${options.measuredRuns} on port ${port} (root=${root})...\n`
      );
      const result = await runOnce(
        options.bundlePath,
        port,
        root,
        options.spawnTimeoutMs,
        options.compileCacheDir
      );
      results.push(result);
      port++;
    }
    const medians = summarize(results);
    return { runs: results, medians };
  } finally {
    for (const root of tmpRootsToCleanup) {
      try {
        rmSync(root, { recursive: true, force: true });
      } catch {
        // best-effort cleanup
      }
    }
  }
}

async function main(): Promise<void> {
  const options = parseArgs(argv.slice(2));
  stdout.write(
    `Measuring backend cold start: bundle=${options.bundlePath} warmup=${options.warmupRuns} runs=${options.measuredRuns}\n`
  );
  const { runs, medians } = await measureColdStart(options);
  stdout.write('\nPer-run results (ms):\n');
  for (const [i, r] of runs.entries()) {
    stdout.write(
      `  #${i + 1}  totalBootstrap=${r.totalBootstrapMs.toFixed(1)}  ` +
        `totalSinceModuleEval=${r.totalSinceModuleEvalMs.toFixed(1)}  ` +
        `wallClock=${r.wallClockToTimingLineMs.toFixed(1)}\n`
    );
  }
  stdout.write('\nMedians:\n');
  for (const field of NUMERIC_FIELDS) {
    stdout.write(`${formatRow(field, medians[field])}\n`);
  }
  stdout.write('\nJSON:\n');
  stdout.write(`${JSON.stringify({ medians, runs }, null, 2)}\n`);
}

if (isDirectEntrypoint(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    exit(1);
  });
}
