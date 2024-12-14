import { Parameter, TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { EventUtils } from '../../utils/event-utils.service';

@Injectable({
  providedIn: 'root'
})
export class VideoTrigger {
  constructor(private eventUtils: EventUtils) {}
  videoTrigger({
    accountId,
    containerId,
    progressThresholdsPercent = '10,25,50,75'
  }: {
    accountId: string;
    containerId: string;
    progressThresholdsPercent?: string;
  }): TriggerConfig {
    return {
      accountId,
      containerId,
      name: 'event youtube video',
      type: 'YOU_TUBE_VIDEO',
      fingerprint: '1689849183312',
      parameter: [
        {
          type: 'TEMPLATE',
          key: 'progressThresholdsPercent',
          value: progressThresholdsPercent
        },
        {
          type: 'BOOLEAN',
          key: 'captureComplete',
          value: 'true'
        },
        {
          type: 'BOOLEAN',
          key: 'captureStart',
          value: 'true'
        },
        {
          type: 'BOOLEAN',
          key: 'fixMissingApi',
          value: 'true'
        },
        {
          type: 'TEMPLATE',
          key: 'triggerStartOption',
          value: 'WINDOW_LOAD'
        },
        {
          type: 'TEMPLATE',
          key: 'radioButtonGroup1',
          value: 'PERCENTAGE'
        },
        {
          type: 'BOOLEAN',
          key: 'capturePause',
          value: 'false'
        },
        {
          type: 'BOOLEAN',
          key: 'captureProgress',
          value: 'true'
        }
      ]
    };
  }

  createVideoTrigger(accountId: string, containerId: string): TriggerConfig[] {
    // TODO: get the information whether the video is included in the data
    try {
      const data = [] as any;
      console.log('Creating video trigger...');
      console.log('data: ', data);
      if (this.eventUtils.isIncludeVideo(data)) {
        const _videoTrigger = this.videoTrigger({
          accountId,
          containerId
        });
        return [_videoTrigger];
      }
      return []; // if there's no video trigger, return an empty array
    } catch (error) {
      console.error('Failed to create video trigger:', error);
      return []; // if there's an error, return an empty array
    }
  }
}
