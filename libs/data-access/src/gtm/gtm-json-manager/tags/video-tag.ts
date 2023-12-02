import {
  TagConfig,
  TriggerConfig,
} from 'src/app/interfaces/gtm-config-generator';
import { isIncludeVideo } from '../../utilities/event-utils';
import {
  createBooleanParameter,
  createBuiltInListParameter,
  createMapParameter,
  createTagReferenceParameter,
  createTemplateParameter,
} from '../parameter-utils';

export function videoTag(
  configurationName: string,
  accountId: string,
  containerId: string,
  triggerId: string
): TagConfig[] {
  return [
    {
      accountId,
      containerId,
      name: 'GA4 Event - Video',
      type: 'gaawe',
      parameter: [
        createBooleanParameter('sendEcommerceData', 'false'),
        createTemplateParameter('eventName', 'video_{{Video Status}}'),
        createBuiltInListParameter('eventParameters', [
          createMapParameter('video_current_time', '{{Video Current Time}}'),
          createMapParameter('video_duration', '{{Video Duration}}'),
          createMapParameter('video_percent', '{{Video Percent}}'),
          createMapParameter('video_provider', '{{Video Provider}}'),
          createMapParameter('video_title', '{{Video Title}}'),
          createMapParameter('video_url', '{{Video URL}}'),
          createMapParameter('visible', '{{Video Visible}}'),
        ]),
        createTagReferenceParameter('measurementId', configurationName),
      ],
      fingerprint: '1690374452646',
      firingTriggerId: [triggerId],
    },
    {
      accountId,
      containerId,
      name: 'cHTML - Youtube iframe API script',
      type: 'html',
      parameter: [
        createTemplateParameter(
          'html',
          '<script src="https://www.youtube.com/iframe_api">\n'
        ),
        createBooleanParameter('supportDocumentWrite', 'false'),
      ],
      fingerprint: '1689848944995',
      firingTriggerId: [triggerId],
    },
  ];
}

export function createVideoTag(
  configurationName: string,
  accountId: string,
  containerId: string,
  data: Record<string, string>[],
  triggers: TriggerConfig[]
) {
  try {
    if (!isIncludeVideo(data)) {
      return [];
    }

    const trigger = triggers.find(
      (trigger) => trigger.name === 'event youtube video'
    );
    if (!trigger || !trigger.triggerId) {
      throw new Error("Couldn't find matching trigger for video tag");
    }

    return videoTag(
      configurationName,
      accountId,
      containerId,
      trigger.triggerId as string
    );
  } catch (error) {
    console.error('Error while creating video tag:', error);
    // Potentially re-throw the error if it should be handled upstream
    // throw error;
    return [];
  }
}
