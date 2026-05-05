import { isMainModule } from '../../shared/entrypoint/entrypoint.ts';
import { getRepoContext, resetState } from '../shared/shared.ts';

export function main(): void {
  const repoContext = getRepoContext();
  resetState(repoContext.root);
  console.log('Review gate state cleared.');
}

if (isMainModule(import.meta.url)) {
  main();
}
