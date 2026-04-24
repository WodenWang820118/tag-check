import { pathToFileURL } from 'node:url';

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

function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    let buffer = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
    });
    process.stdin.on('end', () => resolve(buffer));
  });
}

const isEntryPoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
