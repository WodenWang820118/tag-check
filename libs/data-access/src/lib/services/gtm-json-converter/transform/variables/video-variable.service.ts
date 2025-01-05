import { Injectable } from '@angular/core';
import { VariableTypeEnum, VideoVariableConfig } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class VideoVariable {
  videoBuiltInVariable({
    accountId,
    containerId
  }: {
    accountId: string;
    containerId: string;
  }): VideoVariableConfig[] {
    return [
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_PROVIDER,
        name: 'Video Provider'
      },
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_URL,
        name: 'Video URL'
      },
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_TITLE,
        name: 'Video Title'
      },
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_DURATION,
        name: 'Video Duration'
      },
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_PERCENT,
        name: 'Video Percent'
      },
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_VISIBLE,
        name: 'Video Visible'
      },
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_STATUS,
        name: 'Video Status'
      },
      {
        accountId,
        containerId,
        type: VariableTypeEnum.VIDEO_CURRENT_TIME,
        name: 'Video Current Time'
      }
    ];
  }
}
