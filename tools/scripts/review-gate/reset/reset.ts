import { isDirectEntrypoint } from '../../shared/paths.ts';
import { getRepoContext, resetState } from '../shared/shared.ts';

export function main(): void {
  const repoContext = getRepoContext();
  resetState(repoContext.root);
  console.log('Review gate state cleared.');
}

if (isDirectEntrypoint(import.meta.url)) {
  main();
}
