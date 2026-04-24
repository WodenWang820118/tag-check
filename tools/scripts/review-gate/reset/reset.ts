import { pathToFileURL } from 'node:url';

import { getRepoContext, resetState } from '../shared/shared.ts';

export function main(): void {
  const repoContext = getRepoContext();
  resetState(repoContext.root);
  console.log('Review gate state cleared.');
}

const isEntryPoint =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntryPoint) {
  main();
}
