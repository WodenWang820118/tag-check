import { Parameter, TagConfig, Trigger, TriggerConfig } from '@utils';
import { EventUtils } from '../../utils/event-utils.service';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class VideoTag {
  constructor(
    private parameterUtils: ParameterUtils,
    private eventUtils: EventUtils
  ) {}
  videoTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggerId: string
  ): TagConfig[] {
    return [
      {
        accountId,
        containerId,
        name: 'GA4 event - Video',
        type: 'gaawe',
        parameter: [
          this.parameterUtils.createBooleanParameter(
            'sendEcommerceData',
            'false'
          ),
          this.parameterUtils.createTemplateParameter(
            'eventName',
            'video_{{Video Status}}'
          ),
          this.parameterUtils.createBuiltInListParameter('eventSettingsTable', [
            this.parameterUtils.createMapParameter(
              'video_current_time',
              '{{Video Current Time}}'
            ),
            this.parameterUtils.createMapParameter(
              'video_duration',
              '{{Video Duration}}'
            ),
            this.parameterUtils.createMapParameter(
              'video_percent',
              '{{Video Percent}}'
            ),
            this.parameterUtils.createMapParameter(
              'video_provider',
              '{{Video Provider}}'
            ),
            this.parameterUtils.createMapParameter(
              'video_title',
              '{{Video Title}}'
            ),
            this.parameterUtils.createMapParameter(
              'video_url',
              '{{Video URL}}'
            ),
            this.parameterUtils.createMapParameter(
              'visible',
              '{{Video Visible}}'
            )
          ]),
          this.parameterUtils.createTemplateParameter(
            'measurementIdOverride',
            '{{Measurement ID}}'
          )
        ],
        fingerprint: '1690374452646',
        firingTriggerId: [triggerId],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      },
      {
        accountId,
        containerId,
        name: 'cHTML - Youtube iframe API script',
        type: 'html',
        parameter: [
          this.parameterUtils.createTemplateParameter(
            'html',
            '<script src="https://www.youtube.com/iframe_api">\n'
          ),
          this.parameterUtils.createBooleanParameter(
            'supportDocumentWrite',
            'false'
          )
        ],
        fingerprint: '1689848944995',
        firingTriggerId: [triggerId],
        tagFiringOption: 'ONCE_PER_EVENT',
        monitoringMetadata: {
          type: 'MAP'
        },
        consentSettings: {
          consentStatus: 'NOT_SET'
        }
      }
    ];
  }

  createVideoTag(
    configurationName: string,
    accountId: string,
    containerId: string,
    triggers: Trigger[]
  ): TagConfig[] {
    try {
      // TODO: get the information whether the video is included in the data
      const data = [] as any;
      if (!this.eventUtils.isIncludeVideo(data)) {
        return [];
      }

      const trigger = triggers.find(
        (trigger) => trigger.name === 'event youtube video'
      );
      if (!trigger || !trigger.triggerId) {
        throw new Error("Couldn't find matching trigger for video tag");
      }

      return this.videoTag(
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
}
