import { parseCliArgs, readReviewContext } from './cli-args-and-prompt.ts';
import {
  collectRepoChangedFiles,
  collectRepoDiffText,
  collectRepoHasUntrackedFiles
} from './repo-state.ts';
import { executeReviewFlow, getDefaultReviewFlowDependencies } from './review-flow.ts';

export async function main(argv = process.argv.slice(2)): Promise<void> {
  const parsed = parseCliArgs(argv);

  if (!parsed.checkpoint) {
    throw new Error(
      'Missing --checkpoint. Expected one of: plan, implementation, test, pre-merge.'
    );
  }

  const context = await readReviewContext(parsed.contextFile);
  if (!context.trim()) {
    throw new Error(
      'Review context is required. Pass --context-file <path> or pipe the review context via stdin.'
    );
  }

  const output = await executeReviewFlow(
    {
      checkpoint: parsed.checkpoint,
      context,
      focus: parsed.focus,
      model: parsed.model,
      provider: parsed.provider,
      repoChangedFiles: collectRepoChangedFiles(process.cwd()),
      repoDiffText: collectRepoDiffText(process.cwd()),
      repoHasUntrackedFiles: collectRepoHasUntrackedFiles(process.cwd())
    },
    getDefaultReviewFlowDependencies()
  );

  process.stdout.write(`${output.trimEnd()}\n`);
}
