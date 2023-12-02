import { TriggerConfig } from 'src/app/interfaces/gtm-config-generator';
import { isIncludeScroll } from '../../utilities/event-utils';
import {
  createBooleanParameter,
  createTemplateParameter,
} from '../parameter-utils';

export function scrollTriggers({
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
      createTemplateParameter('verticalThresholdUnits', 'PERCENT'),
      createTemplateParameter(
        'verticalThresholdsPercent',
        verticalThresholdsPercent
      ),
      createBooleanParameter('verticalThresholdOn', 'true'),
      createTemplateParameter('triggerStartOption', 'WINDOW_LOAD'),
      createBooleanParameter('horizontalThresholdOn', 'false'),
    ],
  };
}

export function createScrollTrigger(
  accountId: string,
  containerId: string,
  data: Record<string, string>[]
): TriggerConfig[] {
  try {
    if (isIncludeScroll(data)) {
      const _scrollTrigger = scrollTriggers({
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
