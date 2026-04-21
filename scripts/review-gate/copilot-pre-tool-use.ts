import {
  buildDenyPayload,
  evaluateHookPermission,
  getRepoContext,
  loadState,
  parseHookInput
} from './shared.ts';

const rawInput = await new Promise<string>((resolve) => {
  let buffer = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    buffer += chunk;
  });
  process.stdin.on('end', () => resolve(buffer));
});

const hookInput = parseHookInput(rawInput);
const repoContext = getRepoContext(hookInput.cwd || process.cwd());
const state = loadState(repoContext.root);
const evaluation = evaluateHookPermission({
  hookInput,
  repoContext,
  state
});

if (!evaluation.allow) {
  process.stdout.write(buildDenyPayload(evaluation.reason ?? 'Gate blocked.'));
}
