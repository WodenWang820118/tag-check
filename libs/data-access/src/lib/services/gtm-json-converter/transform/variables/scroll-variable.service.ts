import { Injectable } from '@angular/core';
import { ScrollVariableConfig, VariableTypeEnum } from '@utils';

/**
 * The built-in Scroll Depth Threshold variable the scroll tag reads.
 */
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
