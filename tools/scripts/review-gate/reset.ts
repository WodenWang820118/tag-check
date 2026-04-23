import { getRepoContext, resetState } from './shared.ts';

const repoContext = getRepoContext();
resetState(repoContext.root);
console.log('Review gate state cleared.');
