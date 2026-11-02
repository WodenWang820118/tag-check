import { isMainModule } from '../../shared/entrypoint/entrypoint.ts';
import { main } from '../checkpoint-review/main/main.ts';

// The runner is only the package entrypoint and public surface; the review
// policy, provider routing and flow live in ../checkpoint-review.
export type {
  ConcreteReviewProvider,
  ParsedCliArgs,
  ReviewCheckpoint,
  ReviewExecution,
  ReviewFlowDependencies,
  ReviewProvider,
  ReviewRiskLevel
} from './contracts.ts';
export {
  buildReviewPrompt,
  parseCliArgs
} from '../checkpoint-review/cli-args-and-prompt/cli-args-and-prompt.ts';
export { main } from '../checkpoint-review/main/main.ts';
export {
  createCheckpointReviewTelemetryContext,
  createReviewExecution,
  executeReviewFlow,
  getReviewExecutionPlan
} from '../checkpoint-review/review-flow/review-flow.ts';
export {
  inferAutoReviewRisk,
  parseChangedFilesFromContext
} from '../checkpoint-review/risk-policy/risk-policy.ts';

if (isMainModule(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
