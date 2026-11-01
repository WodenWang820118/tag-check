/**
 * Dead-code ratchet: knip (TypeScript), vulture (Python) and a Rust
 * `allow(dead_code)` freeze. The same script runs in tag-check, LAW,
 * capture-workbench and cert-prep; only the CONFIG block differs.
 *
 * Why a ratchet: removing every finding at once would block all work, so
 * the known findings live in `tools/quality/dead-code-baseline.json`. This
 * gate fails only on findings NOT in the baseline (new dead code). With
 * `--ci` it also fails on baseline entries that no longer occur, so the
 * baseline can only shrink.
 *
 * Passes:
 * - `default`: knip, everything reachable from any entry, tests included.
 * - `production`: knip with only production entries (`!` in knip.json).
 *   Code that only tests still reference shows up here. Keep production
 *   (`!`) and non-production project globs in knip.json disjoint, or knip
 *   silently drops the overlap from the production pass.
 * - `python`: vulture over each target's `src` without tests, so a method
 *   only tests call is reported too. Library targets (published APIs) only
 *   count high-confidence findings.
 * - `rust`: rustc already warns on dead code; the escape hatch is
 *   `#[allow(dead_code)]`, so every such attribute is frozen and a new one
 *   fails. Code only tests use belongs under `#[cfg(test)]`, not behind
 *   `cfg_attr(not(test), allow(dead_code))`.
 *
 * Usage (from the repo root):
 *   node <this file>            # check
 *   node <this file> --ci       # check; a stale baseline fails too
 *   node <this file> --update   # rewrite the baseline
 *   node <this file> --hook     # Claude Code Stop hook (.claude/settings.json)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

interface PythonTarget {
  /** Directory whose uv environment has vulture (a dev dependency there). */
  cwd: string;
  /** Source paths relative to `cwd`; tests are deliberately not included. */
  paths: string[];
  /** Published library: its public API is used by consumers, so only 80%+ findings count. */
  library: boolean;
}

interface GateConfig {
  /** Repo root relative to this file's directory. */
  repoRoot: string;
  pythonTargets: PythonTarget[];
  rust: boolean;
}

// ---- CONFIG (per repository) -------------------------------------------
const CONFIG: GateConfig = {
  repoRoot: '../../..',
  pythonTargets: [],
  rust: true
};
// -------------------------------------------------------------------------

export type GateMode = 'default' | 'production' | 'python' | 'rust';

/** Issue types the production pass reports; its binaries are false positives from project.json test targets. */
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

/**
 * FastAPI routes, pydantic validators and pytest fixtures are called by the
 * framework, never by our code.
 */
const VULTURE_IGNORE_DECORATORS = [
  '@router.*',
  '@app.*',
  '@*.get',
  '@*.post',
  '@*.put',
  '@*.patch',
  '@*.delete',
  '@field_validator',
  '@model_validator',
  '@pytest.fixture'
];

/** Generated contracts and vendored third-party code are not ours to trim. */
const VULTURE_EXCLUDE = [
  '*/generated/*',
  '*/_vendor/*',
  '*generated_models.py'
];

/**
 * vulture flags every pydantic/dataclass field as an "unused variable" at
 * 60%, so variables and attributes count only at the 80%+ level it reserves
 * for genuinely unused locals. Functions, methods, classes, properties and
 * imports count from 60%, where "only tests call it" lands.
 */
const VULTURE_LOW_CONFIDENCE_KINDS = new Set([
  'function',
  'method',
  'class',
  'property',
  'import'
]);

interface KnipIssueRow {
  file: string;
  [issueType: string]: unknown;
}

interface KnipJsonReport {
  issues: KnipIssueRow[];
}

/**
 * Flattens a knip JSON report into stable, line-number-free keys
 * (`mode|type|file|symbol`) so edits that only shift lines are not new.
 */
export function flattenKnipReport(
  report: KnipJsonReport,
  mode: GateMode
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

/** Gives the n-th repeat of a key an ordinal (`x#2`) so a second identical finding still counts as new. */
function numbered(keys: string[]): string[] {
  const seen = new Map<string, number>();
  return keys.map((key) => {
    const count = (seen.get(key) ?? 0) + 1;
    seen.set(key, count);
    return count === 1 ? key : `${key}#${count}`;
  });
}

const VULTURE_LINE =
  /^(?<file>.+?):\d+: (?:unused (?<kind>\w+) '(?<name>[^']+)'|(?<other>unreachable code|redundant if-condition)[^(]*)\s*\((?<confidence>\d+)% confidence/;

/**
 * Parses vulture's text output into line-free keys. `cwd` is the directory
 * vulture ran in, relative to the repo root; reported paths are resolved
 * against it.
 */
export function parseVultureOutput(
  output: string,
  cwd: string,
  library = false
): string[] {
  const keys: string[] = [];
  for (const line of output.split(/\r?\n/)) {
    const match = VULTURE_LINE.exec(line.trim());
    if (!match?.groups) continue;
    const { kind, name, other } = match.groups;
    const confidence = Number(match.groups.confidence);
    const issueKind = kind ?? other.replace(/ /g, '-');
    if (
      confidence < 80 &&
      (library || !VULTURE_LOW_CONFIDENCE_KINDS.has(issueKind))
    ) {
      continue;
    }
    const file = posix.normalize(
      `${cwd}/${match.groups.file.replace(/\\/g, '/')}`
    );
    keys.push(`python|${issueKind}|${file}|${name ?? issueKind}`);
  }
  return numbered(keys).sort();
}

/** Parses `git grep -n 'allow(dead_code)'` output into one key per attribute. */
export function parseRustAllows(gitGrepOutput: string): string[] {
  const keys = gitGrepOutput
    .split(/\r?\n/)
    .map((line) => /^(?<file>[^:]+):\d+:/.exec(line)?.groups?.file)
    .filter((file): file is string => Boolean(file))
    .map((file) => `rust|allow-dead-code|${file}|allow(dead_code)`);
  return numbered(keys).sort();
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

/**
 * Something unused everywhere shows up in both knip passes; keep only the
 * default key, so a `production` key always means "only tests still use it".
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

const SCOPE_LABEL: Record<string, string> = {
  production: ' (only tests use it)',
  python: ' (python; unused outside tests)',
  rust: ' (rust; remove the attribute and the dead code it hides)'
};

export function formatKey(key: string): string {
  const [mode, issueType, file, name] = key.split('|');
  const where = name === file ? file : `${file} :: ${name}`;
  return `  - [${issueType}]${SCOPE_LABEL[mode] ?? ''} ${where}`;
}

/** Code paths whose changes can create or remove dead code. */
const CODE_CHANGE =
  /\.(ts|mts|cts|js|mjs|cjs|html|py|rs)$|(^|\/)(package|knip)\.json$|(^|\/)(pyproject|Cargo)\.toml$/;

export function touchesCode(gitPaths: string[]): boolean {
  return gitPaths.some((path) => CODE_CHANGE.test(path.trim()));
}

function runKnip(repoRoot: string, mode: 'default' | 'production'): string[] {
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
  // knip exits 1 when it finds issues; anything else is a crash.
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `knip (${mode}) failed with status ${result.status}:\n${result.stderr}`
    );
  }
  return flattenKnipReport(JSON.parse(result.stdout) as KnipJsonReport, mode);
}

function runVulture(repoRoot: string, target: PythonTarget): string[] {
  const result = spawnSync(
    'uv',
    [
      'run',
      '--locked',
      'vulture',
      ...target.paths,
      '--min-confidence',
      '60',
      '--exclude',
      VULTURE_EXCLUDE.join(','),
      '--ignore-decorators',
      VULTURE_IGNORE_DECORATORS.join(',')
    ],
    {
      cwd: join(repoRoot, target.cwd),
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024
    }
  );
  // vulture exits 3 when it finds dead code; anything else is a crash.
  if (result.status !== 0 && result.status !== 3) {
    throw new Error(
      `vulture (${target.cwd}) failed with status ${result.status}:\n${result.stderr}${result.error ?? ''}`
    );
  }
  return parseVultureOutput(result.stdout, target.cwd, target.library);
}

function runRustAllows(repoRoot: string): string[] {
  const result = spawnSync(
    'git',
    ['grep', '-n', '-F', 'allow(dead_code)', '--', '*.rs'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }
  );
  // git grep exits 1 when nothing matches.
  if (result.status !== 0 && result.status !== 1) {
    throw new Error(
      `git grep failed with status ${result.status}:\n${result.stderr}`
    );
  }
  return parseRustAllows(result.stdout);
}

function collect(repoRoot: string): string[] {
  return [
    ...mergeModes(
      runKnip(repoRoot, 'default'),
      runKnip(repoRoot, 'production')
    ),
    ...CONFIG.pythonTargets.flatMap((target) => runVulture(repoRoot, target)),
    ...(CONFIG.rust ? runRustAllows(repoRoot) : [])
  ].sort();
}

function git(repoRoot: string, args: string[]): string[] {
  const result = spawnSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  if (result.status !== 0) return [];
  return result.stdout.split('\n').filter(Boolean);
}

function baselinePathOf(repoRoot: string): string {
  return join(repoRoot, 'tools/quality/dead-code-baseline.json');
}

function selfCommand(repoRoot: string): string {
  return `node ${relative(repoRoot, fileURLToPath(import.meta.url)).replace(/\\/g, '/')}`;
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
        'If it is used in a way the tool cannot see (a CLI entry, DI by string,',
        'a framework callback), add a knip.json entry or a vulture decorator',
        'ignore in this script; never add new dead code to the baseline.'
      ].join('\n')
    );
  }
  if (stale.length > 0) {
    console.error(
      [
        `dead-code gate: ${stale.length} baseline finding(s) are gone. Shrink the baseline:`,
        `  ${selfCommand(repoRoot)} --update`,
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

/**
 * Claude Code Stop hook. Runs only when this checkout has code changes
 * (uncommitted, or commits not on the upstream), so chat-only turns and
 * other people's debt never block a stop. Exit 2 shows stderr to the model
 * and keeps it working; `stop_hook_active` means it already had one round of
 * feedback, so it may stop (no loops).
 */
function runAsStopHook(repoRoot: string): number {
  let payload: { stop_hook_active?: boolean } = {};
  try {
    payload = JSON.parse(readFileSync(0, 'utf8') || '{}');
  } catch {
    // No or malformed stdin: treat it as a normal stop.
  }
  if (payload.stop_hook_active) return 0;
  const changed = [
    ...git(repoRoot, ['status', '--porcelain']).map((line) => line.slice(3)),
    ...git(repoRoot, ['diff', '--name-only', '@{upstream}...HEAD'])
  ];
  if (!touchesCode(changed)) return 0;
  return check(repoRoot, false) === 0 ? 0 : 2;
}

export function main(argv: string[]): number {
  const repoRoot = resolve(
    dirname(fileURLToPath(import.meta.url)),
    CONFIG.repoRoot
  );
  if (argv.includes('--hook')) return runAsStopHook(repoRoot);
  if (argv.includes('--update')) return writeBaseline(repoRoot);
  return check(repoRoot, argv.includes('--ci'));
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  process.exitCode = main(process.argv.slice(2));
}
