/**
 * Dead-code ratchet built on knip.
 *
 * Why a ratchet: the repo already carries dead code, so failing on every knip
 * finding would block all work until a big cleanup lands. Instead the known
 * findings live in `tools/quality/dead-code-baseline.json`; this gate fails
 * only on findings that are NOT in the baseline (new dead code), and in
 * `--ci` mode also on baseline entries that no longer occur, so the baseline
 * can only shrink.
 *
 * Two knip passes run:
 * - `default`: everything reachable from any entry, tests included.
 * - `production`: only production entries (`!` in knip.json). Code that only
 *   tests still reference shows up here, the case a plain reference count
 *   misses.
 *
 * Usage:
 *   node tools/scripts/dead-code-gate/dead-code-gate.ts            # check
 *   node tools/scripts/dead-code-gate/dead-code-gate.ts --ci       # check + stale baseline fails
 *   node tools/scripts/dead-code-gate/dead-code-gate.ts --update   # rewrite baseline
 *   node tools/scripts/dead-code-gate/dead-code-gate.ts --hook     # Claude Code Stop hook (.claude/settings.json)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export type KnipMode = 'default' | 'production';

/** Issue types the production pass reports; binaries there are false positives from project.json test targets. */
const PRODUCTION_ISSUE_TYPES = [
  'files',
  'dependencies',
  'exports',
  'types',
  'nsExports',
  'nsTypes',
  'enumMembers',
  'duplicates'
];

interface KnipIssueRow {
  file: string;
  [issueType: string]: unknown;
}

interface KnipJsonReport {
  issues: KnipIssueRow[];
}

/**
 * Flattens a knip JSON report into stable, line-number-free keys
 * (`mode|type|file|symbol`) so unrelated edits that shift lines do not count
 * as new findings.
 */
export function flattenKnipReport(
  report: KnipJsonReport,
  mode: KnipMode
): string[] {
  const keys = new Set<string>();
  for (const row of report.issues) {
    for (const [issueType, value] of Object.entries(row)) {
      if (issueType === 'file') continue;
      for (const name of issueNames(value)) {
        keys.add(`${mode}|${issueType}|${row.file}|${name}`);
      }
    }
  }
  return [...keys].sort();
}

function issueNames(value: unknown): string[] {
  const entries = Array.isArray(value)
    ? value
    : value && typeof value === 'object'
      ? Object.values(value)
      : [];
  return entries.flatMap((entry): string[] => {
    // `duplicates` rows are arrays of {name} describing one duplicate group.
    if (Array.isArray(entry)) {
      return [
        entry
          .map((item) => String((item as { name?: unknown }).name))
          .sort()
          .join('+')
      ];
    }
    if (entry && typeof entry === 'object' && 'name' in entry) {
      return [String((entry as { name: unknown }).name)];
    }
    return [];
  });
}

export interface RatchetResult {
  added: string[];
  stale: string[];
}

export function compareWithBaseline(
  current: string[],
  baseline: string[]
): RatchetResult {
  const baselineSet = new Set(baseline);
  const currentSet = new Set(current);
  return {
    added: current.filter((key) => !baselineSet.has(key)),
    stale: baseline.filter((key) => !currentSet.has(key))
  };
}

export function formatKey(key: string): string {
  const [mode, issueType, file, name] = key.split('|');
  const where = name === file ? file : `${file} :: ${name}`;
  const scope = mode === 'production' ? ' (only tests use it)' : '';
  return `  - [${issueType}]${scope} ${where}`;
}

function runKnip(repoRoot: string, mode: KnipMode): string[] {
  const knipBin = join(repoRoot, 'node_modules', 'knip', 'bin', 'knip.js');
  const args = [knipBin, '--reporter', 'json', '--no-progress'];
  if (mode === 'production') {
    args.push('--production', '--include', PRODUCTION_ISSUE_TYPES.join(','));
  }
  const result = spawnSync(process.execPath, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024
  });
  // knip exits 1 when it finds issues; anything else (or no JSON) is a crash.
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `knip (${mode}) failed with status ${result.status}:\n${result.stderr}`
    );
  }
  return flattenKnipReport(JSON.parse(result.stdout) as KnipJsonReport, mode);
}

/** Code paths whose changes can create or remove dead code. */
const CODE_CHANGE =
  /\.(ts|mts|cts|js|mjs|cjs|html)$|(^|\/)(package|knip)\.json$/;

export function touchesCode(gitPaths: string[]): boolean {
  return gitPaths.some((path) => CODE_CHANGE.test(path.trim()));
}

function git(repoRoot: string, args: string[]): string[] {
  const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout.split('\n').filter(Boolean);
}

/**
 * Claude Code Stop hook. Runs the check only when this checkout has code
 * changes (uncommitted, or commits not yet on the upstream), so chat-only
 * sessions and other people's debt never block a stop. Exit 2 makes Claude
 * Code show stderr to the model and keep it working; `stop_hook_active`
 * means it already got one round of feedback, so let it stop to avoid loops.
 */
function runAsStopHook(repoRoot: string): number {
  let payload: { stop_hook_active?: boolean } = {};
  try {
    payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    // No or malformed stdin: treat as a normal stop request.
  }
  if (payload.stop_hook_active) return 0;
  const changed = [
    ...git(repoRoot, ['status', '--porcelain']).map((line) => line.slice(3)),
    ...git(repoRoot, ['diff', '--name-only', '@{upstream}...HEAD'])
  ];
  if (!touchesCode(changed)) return 0;
  const status = check(repoRoot, false);
  return status === 0 ? 0 : 2;
}

function main(argv: string[]): number {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  if (argv.includes('--hook')) return runAsStopHook(repoRoot);
  if (argv.includes('--update')) return writeBaseline(repoRoot);
  return check(repoRoot, argv.includes('--ci'));
}

function baselinePathOf(repoRoot: string): string {
  return join(repoRoot, 'tools/quality/dead-code-baseline.json');
}

function collect(repoRoot: string): string[] {
  return mergeModes(
    runKnip(repoRoot, 'default'),
    runKnip(repoRoot, 'production')
  );
}

/**
 * Something unused everywhere shows up in both passes; keep only the default
 * key so a `production` key always means "only tests still use it".
 */
export function mergeModes(
  defaultKeys: string[],
  productionKeys: string[]
): string[] {
  const unusedEverywhere = new Set(
    defaultKeys.map((key) => key.slice('default|'.length))
  );
  const testOnly = productionKeys.filter(
    (key) => !unusedEverywhere.has(key.slice('production|'.length))
  );
  return [...defaultKeys, ...testOnly].sort();
}

function writeBaseline(repoRoot: string): number {
  const current = collect(repoRoot);
  writeFileSync(
    baselinePathOf(repoRoot),
    `${JSON.stringify(current, null, 2)}\n`
  );
  console.log(`dead-code baseline written: ${current.length} known findings`);
  return 0;
}

function check(repoRoot: string, ci: boolean): number {
  const baselinePath = baselinePathOf(repoRoot);
  const current = collect(repoRoot);
  const baseline = existsSync(baselinePath)
    ? (JSON.parse(readFileSync(baselinePath, 'utf8')) as string[])
    : [];
  const { added, stale } = compareWithBaseline(current, baseline);

  if (added.length > 0) {
    console.error(
      [
        `dead-code gate: ${added.length} new finding(s) not in the baseline:`,
        ...added.map(formatKey),
        '',
        'Fix: delete the unused code (or its leftover export/dependency).',
        'If it is used in a way knip cannot see (DI by string, template-only,',
        'CLI entry), add it as an entry in knip.json rather than to the baseline.'
      ].join('\n')
    );
  }
  if (stale.length > 0) {
    console.error(
      [
        `dead-code gate: ${stale.length} baseline finding(s) are gone. Shrink the baseline:`,
        '  node tools/scripts/dead-code-gate/dead-code-gate.ts --update',
        ...stale.map(formatKey)
      ].join('\n')
    );
  }
  if (added.length > 0) return 1;
  if (stale.length > 0 && ci) return 1;
  console.log(
    `dead-code gate: OK (${current.length} known findings, none new)`
  );
  return 0;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = main(process.argv.slice(2));
}
