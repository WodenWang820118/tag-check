import {
  BUILT_IN_SCROLL_EVENT,
  BUILT_IN_VIDEO_EVENTS,
  BUILT_IN_EVENTS,
  CONSENT_STATUS_NOT_NEEDED
} from './constant';

describe('transform constants', () => {
  it('exposes scroll built-in events', () => {
    expect(BUILT_IN_SCROLL_EVENT).toEqual(['scroll']);
  });

  it('exposes video built-in events', () => {
    expect(BUILT_IN_VIDEO_EVENTS).toEqual([
      'video_start',
      'video_progress',
      'video_complete'
    ]);
  });

  it('combines scroll and video into BUILT_IN_EVENTS', () => {
    expect(BUILT_IN_EVENTS).toEqual([
      ...BUILT_IN_SCROLL_EVENT,
      ...BUILT_IN_VIDEO_EVENTS
    ]);
  });

  it('exports the NOT_NEEDED consent status string', () => {
    expect(CONSENT_STATUS_NOT_NEEDED).toBe('NOT_NEEDED');
  });
});
