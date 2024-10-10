import { Injectable } from '@angular/core';
import { Parameter, TriggerConfig } from '@utils';
import { ParameterUtils } from '../parameter-utils.service';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root',
})
export class ScrollTrigger {
  constructor(
    private parameterUtils: ParameterUtils,
    private eventUtils: EventUtils
  ) {}
  scrollTriggers({
    accountId,
    containerId,
    verticalThresholdsPercent = '25,50,75,90',
  }: {
    accountId: string;
    containerId: string;
    verticalThresholdsPercent?: string;
  }): TriggerConfig {
    return {
      accountId,
      containerId,
      name: 'event scroll',
      type: 'SCROLL_DEPTH',
      fingerprint: '1687976535532',
      parameter: [
        this.parameterUtils.createTemplateParameter(
          'verticalThresholdUnits',
          'PERCENT'
        ),
        this.parameterUtils.createTemplateParameter(
          'verticalThresholdsPercent',
          verticalThresholdsPercent
        ),
        this.parameterUtils.createBooleanParameter(
          'verticalThresholdOn',
          'true'
        ),
        this.parameterUtils.createTemplateParameter(
          'triggerStartOption',
          'WINDOW_LOAD'
        ),
        this.parameterUtils.createBooleanParameter(
          'horizontalThresholdOn',
          'false'
        ),
      ],
    };
  }

  createScrollTrigger(
    accountId: string,
    containerId: string,
    data: {
      formattedParameters: Parameter[];
      eventName: string;
    }[]
  ): TriggerConfig[] {
    try {
      if (this.eventUtils.isIncludeScroll(data)) {
        const _scrollTrigger = this.scrollTriggers({
          accountId,
          containerId,
        });
        return [_scrollTrigger];
      }
      return []; // if there's no scroll trigger, return an empty array
    } catch (error) {
      console.error('Failed to create scroll trigger:', error);
      return []; // if there's an error, return an empty array
    }
  }
}
