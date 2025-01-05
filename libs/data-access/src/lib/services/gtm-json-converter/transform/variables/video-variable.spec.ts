import { TestBed } from '@angular/core/testing';
import { VideoVariable } from './video-variable.service';
import { VariableTypeEnum, VideoVariableConfig } from '@utils';

describe('VideoVariable', () => {
  let service: VideoVariable;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VideoVariable]
    });

    service = TestBed.inject(VideoVariable);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create video built-in variable configs correctly', () => {
    const accountId = 'test-account';
    const containerId = 'test-container';

    const result = service.videoBuiltInVariable({ accountId, containerId });
    const expected: VideoVariableConfig[] = [
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
    expect(result).toEqual(expected);
  });

  it('should return an array with 8 items', () => {
    const result = service.videoBuiltInVariable({
      accountId: 'any',
      containerId: 'any'
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(8);
  });

  it('should use the provided accountId and containerId for all items', () => {
    const accountId = 'custom-account';
    const containerId = 'custom-container';

    const result = service.videoBuiltInVariable({ accountId, containerId });

    result.forEach((item) => {
      expect(item.accountId).toBe('custom-account');
      expect(item.containerId).toBe('custom-container');
    });
  });

  it('should have unique types and names for each item', () => {
    const result = service.videoBuiltInVariable({
      accountId: 'any',
      containerId: 'any'
    });
    const types = new Set(result.map((item) => item.type));
    const names = new Set(result.map((item) => item.name));

    expect(types.size).toBe(8);
    expect(names.size).toBe(8);
  });
});
