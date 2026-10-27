import { describe, expect, it } from 'vitest';
import { buildMediaTimeline, RunMedia } from './run-media';

describe('buildMediaTimeline', () => {
  it('places each step on the site recording, from its first frame', () => {
    expect(
      buildMediaTimeline([10_000, undefined, 19_840.4], 8_000, 8_410)
    ).toEqual({
      steps: [
        { index: 0, atMs: 2000 },
        { index: 2, atMs: 11840 }
      ],
      tagAssistantOffsetMs: 410
    });
  });

  it('places a step before the first frame at 0:00', () => {
    expect(buildMediaTimeline([7_500], 8_000, null)).toEqual({
      steps: [{ index: 0, atMs: 0 }],
      tagAssistantOffsetMs: null
    });
  });

  it('has no timeline without a site recording frame', () => {
    expect(buildMediaTimeline([10_000], null, 8_000)).toBeNull();
  });
});

describe('RunMedia', () => {
  it('gives every run its own recording folder name', () => {
    const first = new RunMedia();
    const second = new RunMedia();

    expect(first.recordingKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(second.recordingKey).not.toBe(first.recordingKey);
    expect(first.site).toBeNull();
    expect(first.tagAssistant).toBeNull();
  });
});
