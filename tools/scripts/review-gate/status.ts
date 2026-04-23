import { evaluateApproval, getRepoContext, loadState } from './shared.ts';

const repoContext = getRepoContext();
const state = loadState(repoContext.root);
const evaluation = evaluateApproval(state, repoContext);

console.log(`Review gate root: ${repoContext.root}`);
console.log(`Branch: ${repoContext.branch ?? 'unknown'}`);
console.log(`HEAD: ${repoContext.head ?? 'unknown'}`);
console.log(`Worktree: ${repoContext.dirty ? 'dirty' : 'clean'}`);

if (!evaluation.valid) {
  console.log('Gate: BLOCKED');
  console.log(`Reason: ${evaluation.reason}`);
  if (repoContext.dirty) {
    console.log(
      'Note: The worktree is dirty, but approval is still required for additional mutating actions.'
    );
  }
  process.exit(0);
}

console.log('Gate: READY');
console.log(`Reviewer: ${evaluation.approval.reviewer}`);
console.log(`Focus: ${evaluation.approval.focus}`);
console.log(`Approved at: ${evaluation.approval.approvedAt}`);
console.log(`Expires at: ${evaluation.approval.expiresAt}`);
if (repoContext.dirty) {
  console.log(
    'Note: The worktree is dirty, but the active approval still governs additional mutating actions.'
  );
}
