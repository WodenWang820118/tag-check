export type ReviewCheckpoint = 'plan' | 'implementation' | 'test' | 'pre-merge';
export type ReviewProvider = 'auto' | 'copilot' | 'gemini' | 'codex';
export type ConcreteReviewProvider = Exclude<ReviewProvider, 'auto'>;
export type ReviewRiskLevel = 'low' | 'medium' | 'high';

export interface ParsedCliArgs {
  checkpoint?: ReviewCheckpoint;
  contextFile?: string;
  focus: string;
  model?: string;
  provider: ReviewProvider;
}

export interface ReviewExecution {
  checkpoint: ReviewCheckpoint;
  focus: string;
  model?: string;
  provider: ConcreteReviewProvider;
}

export interface ReviewFlowDependencies {
  cacheUnavailable: (execution: ReviewExecution, error: unknown) => void;
  log: (message: string) => void;
  probe: (
    execution: ReviewExecution
  ) => Promise<{ available: boolean; reason?: string }>;
  run: (execution: ReviewExecution, context: string) => Promise<string>;
}

export const DEFAULT_COPILOT_CLAUDE_MODEL = 'claude-sonnet-4.6';
export const DEFAULT_COPILOT_GPT5_MINI_MODEL = 'gpt-5-mini';

export function getDefaultGeminiModel(): string {
  return 'gemini-3.5-flash-high';
}
