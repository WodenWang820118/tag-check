import { existsSync } from 'node:fs';

export type LocalReviewSeverity =
  | 'critical'
  | 'high'
  | 'medium'
  | 'low'
  | 'info';

export type PaidReviewContextMode = 'full-diff' | 'prefilter-summary';

export interface LocalReviewFinding {
  severity: LocalReviewSeverity;
  title: string;
  detail: string;
  file_path: string | null;
  line: number | null;
  recommendation: string | null;
  profile: string | null;
  rationale: string | null;
  evidence: string | null;
}

export interface LocalReviewProfile {
  name: string;
  description: string;
}

export interface EvaluationRepoTarget {
  name: string;
  root: string;
}

export interface LocalReviewerEvaluationConfig {
  abSampleCount: number;
  jobs: number;
  repoNames: string[];
  rounds: number;
  seed: number;
  smallDiffThresholdChars: number;
}

export interface LocalReviewDoctorReport {
  repo_root: string;
  global_config_path: string;
  repo_config_path: string;
  default_model: string;
  advisory_only: boolean;
  runtime: string;
  runtime_provider: 'foundry' | 'ollama';
  checks: Array<{
    name: string;
    status: 'ok' | 'warn' | 'error';
    detail: string;
  }>;
  profiles: LocalReviewProfile[];
  missing_instruction_profiles: string[];
  summary: string;
}

export interface LocalReviewReport {
  generated_at: string;
  context: {
    repo_root: string;
    base_ref: string | null;
    head_ref: string | null;
    staged: boolean;
    requested_profiles: string[];
    config_source: string | null;
    files: Array<{
      path: string;
      status: string;
      old_path: string | null;
      language: string;
      patch: string;
    }>;
  };
  profiles: LocalReviewProfile[];
  findings: LocalReviewFinding[];
  trace: string[];
  summary: string;
  model_used: string | null;
  runtime_provider: 'foundry' | 'ollama';
  advisory_only: boolean;
}

export interface CommandResult {
  error?: Error;
  status: number | null;
  stderr: string;
  stdout: string;
}

export interface EvaluationSample {
  baseRef: string;
  commit: string;
  committedAtEpoch: number;
  fileCount: number;
  kind:
    | 'small-ts'
    | 'multi-file-refactor'
    | 'workspace-config'
    | 'higher-risk'
    | 'general';
  repoName: string;
  repoRoot: string;
  subject: string;
  totalChangedLines: number;
}

export interface EvaluationLocalResult {
  durationMs: number;
  diffLength: number;
  error?: string;
  findingsCount: number;
  jsonParseable: boolean;
  paidReviewContextLength: number;
  prefilterContextLength: number;
  recommendedEscalation: boolean;
  escalationReasons: string[];
  report?: LocalReviewReport;
  reviewContextLength: number;
  reviewContextMode: PaidReviewContextMode;
  sample: EvaluationSample;
  success: boolean;
  summaryLength: number;
}

export interface EvaluationReviewerResult {
  durationMs: number;
  error?: string;
  output: string;
  providerAvailable: boolean;
  sample: EvaluationSample;
  success: boolean;
}

export interface LocalReviewerDependencies {
  now: () => Date;
  runProcess: (input: {
    args: string[];
    command: string;
    cwd: string;
    env?: NodeJS.ProcessEnv;
    input?: string;
    timeoutMs?: number;
  }) => CommandResult;
}

export interface WindowsProcessBridgePayload {
  args: string[];
  command: string;
  cwd: string;
}

export interface PaidReviewContextSelection {
  contextLength: number;
  contextText: string;
  mode: PaidReviewContextMode;
  originalDiffLength: number;
  smallDiffThresholdChars: number;
}

export type HybridReviewProfileName =
  | 'angular'
  | 'nest'
  | 'typescript'
  | 'repo-habits'
  | 'general';

export type HybridRiskLevel = 'low' | 'medium' | 'high';
export type HybridConfidenceLevel = 'low' | 'medium' | 'high';
export type HybridGptReviewStatus =
  | 'completed'
  | 'unavailable'
  | 'invalid-response'
  | 'runtime-error';
export type HybridLocalMode = 'skipped' | 'targeted' | 'full';
export type HybridDecisionBasis =
  | 'heuristics'
  | 'gpt'
  | 'gpt+local'
  | 'local-fallback';

export interface HybridGptFinding {
  severity: LocalReviewSeverity;
  title: string;
  detail: string;
  file_path: string | null;
  line: number | null;
  recommendation: string | null;
}

export interface HybridGptReview {
  provider: 'copilot-gpt-5-mini';
  model: 'gpt-5-mini';
  status: HybridGptReviewStatus;
  overall_risk: HybridRiskLevel | null;
  confidence: HybridConfidenceLevel | null;
  needs_local_deep_review: boolean;
  focus_profiles: HybridReviewProfileName[];
  findings: HybridGptFinding[];
  summary: string | null;
  error: string | null;
}

export interface HybridHeuristics {
  changed_files: string[];
  diff_length: number;
  file_count: number;
  routed_profiles: HybridReviewProfileName[];
  sensitive_categories: Array<
    | 'auth'
    | 'secrets'
    | 'filesystem'
    | 'shell'
    | 'network'
    | 'public contract'
    | 'persistent state'
  >;
}

export interface HybridLocalPlan {
  local_mode: HybridLocalMode;
  requested_profiles: HybridReviewProfileName[];
}

export interface HybridLocalReviewResult {
  local_mode: Exclude<HybridLocalMode, 'skipped'>;
  requested_profiles: HybridReviewProfileName[];
  report: LocalReviewReport | null;
  error: string | null;
}

export interface HybridMergedFinding extends LocalReviewFinding {
  source: 'gpt' | 'local';
}

export interface HybridReviewReport {
  strategy: 'gpt-gate';
  heuristics: HybridHeuristics;
  gpt_review: HybridGptReview;
  local_review: LocalReviewReport | null;
  local_mode: HybridLocalMode;
  requested_profiles: HybridReviewProfileName[];
  findings: HybridMergedFinding[];
  merged_findings: HybridMergedFinding[];
  summary: string;
  recommended_escalation: boolean;
  escalation_reasons: string[];
  decision_basis: HybridDecisionBasis;
  local_review_error: string | null;
}

export const DEFAULT_OLLAMA_HOST = 'http://127.0.0.1:11434';
export const DEFAULT_OLLAMA_KEEP_ALIVE = '10m';
export const DEFAULT_OLLAMA_MODEL = 'qwen3:8b';
export const DEFAULT_OLLAMA_TIMEOUT_MS = '120000';
export const DEFAULT_HYBRID_GPT_MODEL = 'gpt-5-mini';
export const MAX_HYBRID_GPT_DIFF_CHARS = 8_000;
export const DEFAULT_EVALUATION_AB_SAMPLE_COUNT = 0;
export const DEFAULT_EVALUATION_ROUNDS = 32;
export const DEFAULT_SAMPLE_SEED = 20260419;
export const DEFAULT_SMALL_DIFF_THRESHOLD_CHARS = 1024;
export const LOCAL_REVIEWER_BUILD_TIMEOUT_MS = 5 * 60 * 1000;
export const LOCAL_REVIEWER_COMMAND_TIMEOUT_MS = 5 * 60 * 1000;
export const DEFAULT_EVALUATION_REPO_NAMES = [
  'gx.law-prep',
  'gx.go',
  'local-reviewer-cli'
] as const;
export const EVALUATION_KIND_ORDER: EvaluationSample['kind'][] = [
  'higher-risk',
  'small-ts',
  'general',
  'multi-file-refactor',
  'workspace-config'
];
export const EVALUATION_KIND_WEIGHTS: Readonly<
  Record<EvaluationSample['kind'], number>
> = {
  'higher-risk': 1,
  'small-ts': 7,
  general: 8,
  'multi-file-refactor': 8,
  'workspace-config': 8
};
export const WINDOWS_PROCESS_BRIDGE_ENV =
  'LOCAL_REVIEWER_WINDOWS_PROCESS_JSON_PATH';
export const WINDOWS_PROCESS_BRIDGE_SCRIPT = [
  "$ProgressPreference = 'SilentlyContinue'",
  `$payload = Get-Content -LiteralPath $env:${WINDOWS_PROCESS_BRIDGE_ENV} -Raw | ConvertFrom-Json`,
  '$command = [string]$payload.command',
  '$stdin = [Console]::In.ReadToEnd()',
  '$resolved = if ([System.IO.Path]::IsPathRooted($command)) {',
  '  $command',
  '} else {',
  '  (Get-Command $command -CommandType Application | Select-Object -First 1).Source',
  '}',
  'if ([string]::IsNullOrEmpty($stdin) -eq $false) {',
  '  $stdin | & $resolved @($payload.args)',
  '} else {',
  '  & $resolved @($payload.args)',
  '}',
  'exit $LASTEXITCODE'
].join('\n');
export const PREFILTER_ARTIFACT_DIR = ['.cache', 'reviews', 'local-reviewer'];
export const PREFILTER_CONTEXT_FILE = 'prefilter-context.md';
export const PREFILTER_REPORT_FILE = 'prefilter-report.json';
export const REVIEWER_CONTEXT_FILE = 'prefilter-review-context.md';
export const EVALUATION_ARTIFACT_DIR = [
  '.cache',
  'reviews',
  'local-reviewer-eval'
];
export const HYBRID_PROFILE_ORDER: HybridReviewProfileName[] = [
  'angular',
  'nest',
  'typescript',
  'repo-habits',
  'general'
] as const;
export const SENSITIVE_REVIEW_AREAS: Array<{
  category:
    | 'auth'
    | 'secrets'
    | 'filesystem'
    | 'shell'
    | 'network'
    | 'public contract'
    | 'persistent state';
  pattern: RegExp;
}> = [
  {
    category: 'auth',
    pattern: /\b(auth|oauth|login|session|jwt|permission|role)\b/i
  },
  {
    category: 'secrets',
    pattern: /\b(secret|token|apikey|api[_-]?key|password|credential)\b/i
  },
  {
    category: 'filesystem',
    pattern:
      /\b(filesystem|readfile|writefile|unlink|readdir|mkdir|rename|path\.)\b/i
  },
  {
    category: 'shell',
    pattern:
      /\b(shell|child_process|spawnsync|spawn\(|execsync|exec\(|powershell)\b/i
  },
  {
    category: 'network',
    pattern: /\b(fetch\(|axios|http\.|https\.|request\(|socket|webhook)\b/i
  },
  {
    category: 'public contract',
    pattern:
      /\b(controller|dto|schema|openapi|graphql|api contract|public contract)\b/i
  },
  {
    category: 'persistent state',
    pattern:
      /\b(migration|database|sql|persist|storage|repository|prisma|typeorm)\b/i
  }
];
export const HYBRID_ANGULAR_PATH_PATTERNS = [
  /\.(component|directive|pipe|service)\.ts$/i,
  /\.(html|scss|css)$/i
];
export const HYBRID_NEST_PATH_PATTERNS = [
  /\.(controller|module|guard|interceptor|pipe|service)\.ts$/i,
  /^apps\/.+\/src\/.+\.ts$/i
];
export const HYBRID_TYPESCRIPT_PATH_PATTERNS = [/\.(ts|tsx|mts|cts)$/i];
export const HYBRID_REPO_HABITS_PATH_PATTERNS = [
  /^package\.json$/i,
  /^pnpm-workspace\.ya?ml$/i,
  /^pnpm-lock\.ya?ml$/i,
  /^nx\.json$/i,
  /(^|\/)tsconfig[^/]*\.json$/i,
  /(^|\/)project\.json$/i,
  /(^|\/)pyproject\.toml$/i,
  /(^|\/)README\.md$/i,
  /\.jsonc?$/i,
  /\.json5$/i,
  /\.md$/i,
  /\.toml$/i,
  /\.ya?ml$/i,
  /^\.github\/.+\.(json|ya?ml)$/i,
  /^local-reviewer\.toml$/i
];

export function normalizeHybridPath(candidate: string): string {
  return candidate.replaceAll('\\', '/').replace(/^\.\//, '').trim();
}

export function normalizeLocalReviewSeverity(
  value: unknown
): LocalReviewSeverity {
  if (
    value === 'critical' ||
    value === 'high' ||
    value === 'medium' ||
    value === 'low' ||
    value === 'info'
  ) {
    return value;
  }

  return 'info';
}

export function normalizeOptionalText(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

export function normalizeOptionalLineNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed =
    typeof value === 'number' ? value : Number.parseInt(String(value), 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export function shuffleWithSeed<T>(items: T[], seed: number): T[] {
  const copy = [...items];
  const random = mulberry32(seed);
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}

export function mulberry32(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = Math.imul(value ^ (value >>> 15), 1 | value);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function shortHash(commit: string): string {
  return commit.slice(0, 7);
}

export function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[middle - 1]! + sorted[middle]!) / 2)
    : sorted[middle]!;
}

export function getPnpmCommand(): string {
  return process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
}

export function sanitizeEnv(
  env: NodeJS.ProcessEnv | undefined
): NodeJS.ProcessEnv | undefined {
  if (!env) {
    return undefined;
  }

  const sanitizedEntries = Object.entries(env).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string'
  );
  return Object.fromEntries(sanitizedEntries);
}

export function resolveWindowsPowerShellPath(): string | null {
  if (process.platform !== 'win32') {
    return null;
  }

  const candidates = [
    'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe',
    'C:\\Program Files\\PowerShell\\7\\pwsh.exe'
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? null;
}

export function encodePowerShellCommand(command: string): string {
  return Buffer.from(command, 'utf16le').toString('base64');
}
