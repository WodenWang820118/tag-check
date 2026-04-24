import type { CommandResult } from '../../../shared/process.ts';

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
