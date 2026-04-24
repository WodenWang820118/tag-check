import { pathToFileURL } from 'node:url';

import {
  createApproval,
  getRepoContext,
  parseArgs,
  saveState,
  validateReviewerId
} from '../shared/shared.ts';

export function main(argv = process.argv.slice(2)): void {
  const options = parseArgs(argv);
  const repoContext = getRepoContext();
  const reviewer = validateReviewerId(options.reviewer);

  if (repoContext.dirty && !options.force) {
    console.error(
      'Cannot open the pre-implementation gate while the worktree is dirty. Clean or reset the worktree first, or rerun with --force if you intentionally need to override this.'
    );
    process.exit(1);
  }

  const state = createApproval({
    reviewer,
    focus: options.focus,
    summary: options.summary,
    repoContext
  });

  saveState(state, repoContext.root);

  console.log('Pre-implementation review approved.');
  console.log(`Reviewer: ${state.approval.reviewer}`);
  console.log(`Focus: ${state.approval.focus}`);
  console.log(`Branch: ${state.approval.branch ?? 'unknown'}`);
  console.log(`HEAD: ${state.approval.head ?? 'unknown'}`);
  console.log(`Expires: ${state.approval.expiresAt}`);
}

const isEntryPoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main();
}
