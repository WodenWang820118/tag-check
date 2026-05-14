import {
  assertCrossFamilyReviewer,
  createApproval,
  defaultMaxFilesForSize,
  getRepoContext,
  parseArgs,
  saveState,
  validateFamily,
  validateGateMode,
  validateReviewerId,
  validateTaskSize,
} from '../shared/shared.ts';
import { isMainModule } from '../../shared/entrypoint/entrypoint.ts';

export function main(argv = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const repoContext = getRepoContext();
  const reviewer = validateReviewerId(options.reviewer);
  const primaryFamily = options.primaryFamily
    ? validateFamily(options.primaryFamily)
    : null;
  const taskSize = options.taskSize ? validateTaskSize(options.taskSize) : null;
  const mode = validateGateMode(options.mode);

  if (mode === 'override' && !options.overrideReason) {
    console.error(
      'Cannot use --mode override without --override-reason "<rationale>".',
    );
    process.exit(1);
  }

  try {
    assertCrossFamilyReviewer({
      reviewer,
      primaryFamily,
      mode,
      overrideReason: options.overrideReason,
    });
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  if (repoContext.dirty && !options.force) {
    console.error(
      'Cannot open the pre-implementation gate while the worktree is dirty. Clean or reset the worktree first, or rerun with --force if you intentionally need to override this.',
    );
    process.exit(1);
  }

  const resolvedMaxFiles =
    options.maxFiles ?? (taskSize ? defaultMaxFilesForSize(taskSize) : null);

  const state = createApproval({
    reviewer,
    focus: options.focus,
    summary: options.summary,
    repoContext,
    primaryFamily,
    taskSize,
    mode,
    maxFiles: resolvedMaxFiles,
    overrideReason: options.overrideReason,
  });

  saveState(state, repoContext.root);

  console.log('Pre-implementation review approved.');
  console.log(`Reviewer: ${state.approval.reviewer}`);
  console.log(`Focus: ${state.approval.focus}`);
  console.log(`Branch: ${state.approval.branch ?? 'unknown'}`);
  console.log(`HEAD: ${state.approval.head ?? 'unknown'}`);
  console.log(`Mode: ${state.approval.mode}`);
  console.log(
    `Primary family: ${state.approval.primaryFamily ?? 'unspecified'}`,
  );
  console.log(`Task size: ${state.approval.taskSize ?? 'unspecified'}`);
  console.log(`Max files: ${state.approval.maxFiles ?? 'unbounded'}`);
  if (state.approval.overrideReason) {
    console.log(`Override reason: ${state.approval.overrideReason}`);
  }
  console.log(`Expires: ${state.approval.expiresAt}`);
}

if (isMainModule(import.meta.url)) {
  main();
}
