import {
  TagConfig,
  TriggerConfig,
} from 'src/app/interfaces/gtm-config-generator';
import { isIncludeScroll } from '../../utilities/event-utils';
import {
  createBooleanParameter,
  createBuiltInListParameter,
  createMapParameter,
  createTagReferenceParameter,
  createTemplateParameter,
} from '../parameter-utils';

export function scrollTag(
  configurationName: string,
  accountId: string,
  containerId: string,
  triggerId: string
): TagConfig[] {
  return [
    {
      accountId,
      containerId,
      name: 'GA4 - scroll',
      type: 'gaawe',
      parameter: [
        createBooleanParameter('sendEcommerceData', 'false'),
        createTemplateParameter('eventName', 'scroll'),
        createBuiltInListParameter('eventParameters', [
          createMapParameter(
            'scroll_depth_threshold',
            '{{Scroll Depth Threshold}}'
          ),
        ]),
        createTagReferenceParameter('measurementId', configurationName),
      ],
      fingerprint: '1690184079241',
      firingTriggerId: [triggerId],
    },
  ];
}

export function createScrollTag(
  configurationName: string,
  accountId: string,
  containerId: string,
  data: Record<string, string>[],
  triggers: TriggerConfig[]
) {
  try {
    if (!isIncludeScroll(data)) {
      return [];
    }

    const trigger = triggers.find((trigger) => trigger.name === 'event scroll');
    if (!trigger || !trigger.triggerId) {
      throw new Error("Couldn't find matching trigger for scroll tag");
    }

    return scrollTag(
      configurationName,
      accountId,
      containerId,
      trigger.triggerId as string
    );
  } catch (error) {
    console.error('Error while creating scroll tag:', error);
    // Potentially re-throw the error if it should be handled upstream
    // throw error;
    return [];
  }
}
