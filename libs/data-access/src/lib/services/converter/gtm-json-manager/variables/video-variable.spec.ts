import { TestBed } from '@angular/core/testing';
import { VideoVariable } from './video-variable.service';

describe('VideoVariable', () => {
  let service: VideoVariable;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [VideoVariable],
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

    expect(result).toEqual([
      {
        accountId,
        containerId,
        type: 'VIDEO_PROVIDER',
        name: 'Video Provider',
      },
      { accountId, containerId, type: 'VIDEO_URL', name: 'Video URL' },
      { accountId, containerId, type: 'VIDEO_TITLE', name: 'Video Title' },
      {
        accountId,
        containerId,
        type: 'VIDEO_DURATION',
        name: 'Video Duration',
      },
      {
        accountId,
        containerId,
        type: 'VIDEO_PERCENT',
        name: 'Video Percent',
      },
      {
        accountId,
        containerId,
        type: 'VIDEO_VISIBLE',
        name: 'Video Visible',
      },
      { accountId, containerId, type: 'VIDEO_STATUS', name: 'Video Status' },
      {
        accountId,
        containerId,
        type: 'VIDEO_CURRENT_TIME',
        name: 'Video Current Time',
      },
    ]);
  });

  it('should return an array with 8 items', () => {
    const result = service.videoBuiltInVariable({
      accountId: 'any',
      containerId: 'any',
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
      containerId: 'any',
    });
    const types = new Set(result.map((item) => item.type));
    const names = new Set(result.map((item) => item.name));

    expect(types.size).toBe(8);
    expect(names.size).toBe(8);
  });
});
