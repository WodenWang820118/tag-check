// Barrel re-export for backward compatibility.
// All types live in ./types.ts, runtime constants in ./constants.ts,
// and normalizer helpers in ./normalizers.ts.
export type {
  CommandResult,
  EvaluationLocalResult,
  EvaluationRepoTarget,
  EvaluationReviewerResult,
  EvaluationSample,
  HybridConfidenceLevel,
  HybridDecisionBasis,
  HybridGptFinding,
  HybridGptReview,
  HybridGptReviewStatus,
  HybridHeuristics,
  HybridLocalMode,
  HybridLocalPlan,
  HybridLocalReviewResult,
  HybridMergedFinding,
  HybridReviewProfileName,
  HybridReviewReport,
  HybridRiskLevel,
  LocalReviewDoctorReport,
  LocalReviewerDependencies,
  LocalReviewerEvaluationConfig,
  LocalReviewFinding,
  LocalReviewProfile,
  LocalReviewReport,
  LocalReviewSeverity,
  PaidReviewContextMode,
  PaidReviewContextSelection,
  WindowsProcessBridgePayload
} from './types.ts';
export {
  DEFAULT_EVALUATION_AB_SAMPLE_COUNT,
  DEFAULT_EVALUATION_REPO_NAMES,
  DEFAULT_EVALUATION_ROUNDS,
  DEFAULT_HYBRID_GPT_MODEL,
  DEFAULT_OLLAMA_HOST,
  DEFAULT_OLLAMA_KEEP_ALIVE,
  DEFAULT_OLLAMA_MODEL,
  DEFAULT_OLLAMA_TIMEOUT_MS,
  DEFAULT_SAMPLE_SEED,
  DEFAULT_SMALL_DIFF_THRESHOLD_CHARS,
  EVALUATION_ARTIFACT_DIR,
  EVALUATION_KIND_ORDER,
  EVALUATION_KIND_WEIGHTS,
  HYBRID_ANGULAR_PATH_PATTERNS,
  HYBRID_NEST_PATH_PATTERNS,
  HYBRID_PROFILE_ORDER,
  HYBRID_REPO_HABITS_PATH_PATTERNS,
  HYBRID_TYPESCRIPT_PATH_PATTERNS,
  LOCAL_REVIEWER_BUILD_TIMEOUT_MS,
  LOCAL_REVIEWER_COMMAND_TIMEOUT_MS,
  MAX_HYBRID_GPT_DIFF_CHARS,
  PREFILTER_ARTIFACT_DIR,
  PREFILTER_CONTEXT_FILE,
  PREFILTER_REPORT_FILE,
  REVIEWER_CONTEXT_FILE,
  SENSITIVE_REVIEW_AREAS,
  WINDOWS_PROCESS_BRIDGE_ENV,
  WINDOWS_PROCESS_BRIDGE_SCRIPT
} from './constants.ts';
export {
  normalizeHybridPath,
  normalizeLocalReviewSeverity,
  normalizeOptionalLineNumber,
  normalizeOptionalText
} from './normalizers.ts';
export { shuffleWithSeed, shortHash, median } from './sampling-utils.ts';
export {
  encodePowerShellCommand,
  getPnpmCommand,
  resolveWindowsPowerShellPath,
  sanitizeEnv
} from '../../../shared/process.ts';
