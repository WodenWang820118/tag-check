import { CanDeactivateFn } from '@angular/router';

export const treeNodeDeactivateGuard: CanDeactivateFn<unknown> = () => {
  console.log('Deactivating');
  return true;
};
