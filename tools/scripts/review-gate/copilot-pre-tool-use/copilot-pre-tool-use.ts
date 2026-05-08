import { isMainModule } from '../../shared/entrypoint/entrypoint.ts';
import {
  buildDenyPayload,
  evaluateHookPermission,
  getRepoContext,
  loadState,
  parseHookInput
} from '../shared/shared.ts';

export async function main(): Promise<void> {
  const rawInput = await new Promise<string>((resolve) => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
    });
    process.stdin.on('end', () => resolve(buffer));
  });

  try {
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
  } catch {
    // Fail-open: if the gate script itself fails, allow the tool use to
    // proceed rather than blocking all Copilot operations.
  }
}

if (isMainModule(import.meta.url)) {
  await main();
}
