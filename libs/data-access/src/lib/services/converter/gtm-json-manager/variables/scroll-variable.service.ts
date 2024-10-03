import { Injectable } from '@angular/core';
import { VariableConfig } from '@utils';

@Injectable({
  providedIn: 'root',
})
export class ScrollVariable {
  scrollBuiltInVariable({
    accountId,
    containerId,
  }: {
    accountId: string;
    containerId: string;
  }): VariableConfig[] {
    return [
      {
        accountId,
        containerId,
        type: 'SCROLL_DEPTH_THRESHOLD',
        name: 'Scroll Depth Threshold',
      },
    ];
  }
}
