import { readStdin } from '../../shared/cli.ts';
import { isDirectEntrypoint } from '../../shared/paths.ts';
import {
  buildDenyPayload,
  evaluateHookPermission,
  getRepoContext,
  loadState,
  parseHookInput
} from '../shared/shared.ts';

export async function main(): Promise<void> {
  const rawInput = await readStdin();
  const hookInput = parseHookInput(rawInput);
  const repoContext = getRepoContext(hookInput.cwd || process.cwd());
  const state = loadState(repoContext.root);
  const evaluation = evaluateHookPermission({
    hookInput,
    repoContext,
    state
  });

  if (!evaluation.allow) {
    process.stdout.write(
      buildDenyPayload(evaluation.reason ?? 'Gate blocked.')
    );
  }
}

if (isDirectEntrypoint(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
