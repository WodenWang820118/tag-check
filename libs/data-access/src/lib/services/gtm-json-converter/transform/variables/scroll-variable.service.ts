import { Injectable } from '@angular/core';
import { ScrollVariableConfig, VariableTypeEnum } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class ScrollVariable {
  scrollBuiltInVariable({
    accountId,
    containerId
  }: {
    accountId: string;
    containerId: string;
  }): ScrollVariableConfig[] {
    return [
      {
        accountId,
        containerId,
        type: VariableTypeEnum.SCROLL_DEPTH_THRESHOLD,
        name: 'Scroll Depth Threshold'
      }
    ];
  }
}
