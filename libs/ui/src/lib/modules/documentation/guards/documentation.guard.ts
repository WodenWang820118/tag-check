import { CanDeactivateFn } from '@angular/router';

export const treeNodeDeactivateGuard: CanDeactivateFn<any> = () => {
  console.log('Deactivating');
  return true;
};
