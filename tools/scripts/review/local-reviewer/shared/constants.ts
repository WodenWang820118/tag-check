import type { EvaluationSample, HybridReviewProfileName } from './types.ts';

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
