// Types and interfaces for the review-gate system.

export const SUPPORTED_REVIEWERS = [
  'copilot-claude',
  'gemini-3.5-flash-high',
  'codex-subagent'
] as const;

export type SupportedReviewer = (typeof SUPPORTED_REVIEWERS)[number];

export const PRIMARY_FAMILIES = ['copilot', 'gemini', 'codex'] as const;
export type PrimaryFamily = (typeof PRIMARY_FAMILIES)[number];

export const TASK_SIZES = ['tiny', 'small', 'medium', 'large', 'huge'] as const;
export type TaskSize = (typeof TASK_SIZES)[number];

export const REVIEW_GATE_MODES = ['standard', 'override'] as const;
export type ReviewGateMode = (typeof REVIEW_GATE_MODES)[number];

export interface RepoContext {
  root: string;
  branch: string | null;
  head: string | null;
  dirty: boolean | null;
  gitCommand: string | null;
}

export interface ReviewApproval {
  type: 'pre-implementation-review';
  reviewer: SupportedReviewer;
  focus: string;
  summary: string;
  approvedAt: string;
  expiresAt: string;
  branch: string | null;
  head: string | null;
  root: string;
  primaryFamily: PrimaryFamily | null;
  taskSize: TaskSize | null;
  mode: ReviewGateMode;
  maxFiles: number | null;
  overrideReason: string | null;
}

export interface ReviewGateState {
  version: 1;
  approval: ReviewApproval;
}

export interface ParsedReviewGateArgs {
  reviewer: string;
  focus: string;
  summary: string;
  force: boolean;
  primaryFamily: string | null;
  taskSize: string | null;
  mode: string;
  maxFiles: number | null;
  overrideReason: string | null;
}

export interface HookInput {
  cwd?: string;
  toolArgs?: { command?: string } | string;
  toolName?: string;
}

export interface HookPermissionResult {
  allow: boolean;
  reason?: string;
}
