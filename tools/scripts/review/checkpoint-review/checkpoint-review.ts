import { pathToFileURL } from 'node:url';

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
export {
  type ConcreteReviewProvider,
  type ParsedCliArgs,
  type ReviewCheckpoint,
  type ReviewExecution,
  type ReviewFlowDependencies,
  type ReviewProvider,
  type ReviewRiskLevel
} from './shared/shared.ts';
export { main } from './main/main.ts';

const isEntryPoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
