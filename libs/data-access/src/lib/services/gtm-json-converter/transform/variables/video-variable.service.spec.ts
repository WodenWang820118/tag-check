import { TestBed } from '@angular/core/testing';
import { VariableTypeEnum } from '@utils';

import { VideoVariable } from './video-variable.service';

describe('VideoVariable', () => {
  let service: VideoVariable;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VideoVariable);
  });

  it('returns the eight built-in video variables in the documented order', () => {
    const result = service.videoBuiltInVariable({
      accountId: 'acc',
      containerId: 'cnt'
    });

    expect(result).toHaveLength(8);
    expect(result.map((v) => v.name)).toEqual([
      'Video Provider',
      'Video URL',
      'Video Title',
      'Video Duration',
      'Video Percent',
      'Video Visible',
      'Video Status',
      'Video Current Time'
    ]);
    expect(result.map((v) => v.type)).toEqual([
      VariableTypeEnum.VIDEO_PROVIDER,
      VariableTypeEnum.VIDEO_URL,
      VariableTypeEnum.VIDEO_TITLE,
      VariableTypeEnum.VIDEO_DURATION,
      VariableTypeEnum.VIDEO_PERCENT,
      VariableTypeEnum.VIDEO_VISIBLE,
      VariableTypeEnum.VIDEO_STATUS,
      VariableTypeEnum.VIDEO_CURRENT_TIME
    ]);
  });

  it('propagates accountId and containerId to every variable', () => {
    const result = service.videoBuiltInVariable({
      accountId: 'acc-1',
      containerId: 'cnt-1'
    });
    for (const variable of result) {
      expect(variable.accountId).toBe('acc-1');
      expect(variable.containerId).toBe('cnt-1');
    }
  });
});
