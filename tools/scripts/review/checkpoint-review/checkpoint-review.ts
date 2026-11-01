import { isDirectEntrypoint } from '../../shared/paths.ts';
import { main } from './main/main.ts';

// Keep the executable file as a small public facade; the review policy and
// provider routing live in the named modules below.
export {
  buildReviewPrompt,
  parseCliArgs
} from './cli-args-and-prompt/cli-args-and-prompt.ts';
export {
  parseChangedFilesFromContext,
  inferAutoReviewRisk
} from './risk-policy/risk-policy.ts';
export {
  createCheckpointReviewTelemetryContext,
  createReviewExecution,
  executeReviewFlow,
  getReviewExecutionPlan
} from './review-flow/review-flow.ts';
export { type ReviewExecution } from './shared/shared.ts';

if (isDirectEntrypoint(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
