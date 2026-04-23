import { pathToFileURL } from 'node:url';

import { main } from './lib/checkpoint-review/main.ts';

export {
  buildReviewPrompt,
  parseCliArgs
} from './lib/checkpoint-review/cli-args-and-prompt.ts';
export {
  parseChangedFilesFromContext,
  inferAutoReviewRisk
} from './lib/checkpoint-review/risk-policy.ts';
export {
  createCheckpointReviewTelemetryContext,
  createReviewExecution,
  executeReviewFlow,
  getReviewExecutionPlan
} from './lib/checkpoint-review/review-flow.ts';
export {
  type ConcreteReviewProvider,
  type ParsedCliArgs,
  type ReviewCheckpoint,
  type ReviewExecution,
  type ReviewFlowDependencies,
  type ReviewProvider,
  type ReviewRiskLevel
} from './lib/checkpoint-review/shared.ts';
export { main } from './lib/checkpoint-review/main.ts';

const isEntryPoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
