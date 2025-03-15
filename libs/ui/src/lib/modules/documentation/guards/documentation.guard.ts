import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { TreeNodeService } from '../services/tree-node/tree-node.service';

export const treeNodeDeactivateGuard: CanDeactivateFn<any> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  const treeNodeService = inject(TreeNodeService);
  console.log('Deactivating');
  return true;
};
