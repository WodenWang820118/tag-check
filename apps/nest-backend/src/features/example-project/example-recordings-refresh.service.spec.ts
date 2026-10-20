import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Step } from '@utils';
import {
  ExampleRecordingsRefreshService,
  isShippedLegacyRecording
} from './example-recordings-refresh.service';
import { events } from './events/events';

// add_to_cart as the example project shipped it up to 2.1.1.
const shippedAddToCartSteps: Step[] = [
  { type: 'setViewport' },
  { type: 'navigate', url: 'https://ng-gtm-sample.vercel.app/home' },
  {
    type: 'click',
    target: 'main',
    selectors: [['div.p-carousel-item-end img']],
    offsetY: 134,
    offsetX: 69
  },
  {
    type: 'click',
    target: 'main',
    selectors: [['main div > button']],
    offsetY: 23.609375,
    offsetX: 46.1875
  }
];

describe('isShippedLegacyRecording', () => {
  it('recognises a recording the example project shipped with', () => {
    expect(isShippedLegacyRecording(shippedAddToCartSteps)).toBe(true);
  });

  it('keeps a recording with any click the user changed', () => {
    const edited = shippedAddToCartSteps.map((step, index) =>
      index === 3 ? { ...step, selectors: [['#my-button']] } : step
    );
    expect(isShippedLegacyRecording(edited)).toBe(false);
  });

  it('keeps recordings without clicks', () => {
    expect(isShippedLegacyRecording(shippedAddToCartSteps.slice(0, 2))).toBe(
      false
    );
  });

  it('never matches the current example recordings, so a refresh runs once', () => {
    for (const example of Object.values(events)) {
      expect(isShippedLegacyRecording(example.recording.steps)).toBe(false);
    }
  });
});

describe('ExampleRecordingsRefreshService', () => {
  const testEventRepositoryService = { listFileReports: vi.fn() };
  const recordingRepositoryService = {
    update: vi.fn().mockResolvedValue(undefined)
  };
  const projectRecordingService = {
    updateRecording: vi.fn().mockResolvedValue(undefined)
  };
  let service: ExampleRecordingsRefreshService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ExampleRecordingsRefreshService(
      testEventRepositoryService as never,
      recordingRepositoryService as never,
      projectRecordingService as never
    );
  });

  it('replaces shipped recordings in the database and the recording file only', async () => {
    testEventRepositoryService.listFileReports.mockResolvedValue([
      {
        eventId: 'shipped',
        eventName: 'add_to_cart',
        recording: { title: 'add_to_cart', steps: shippedAddToCartSteps }
      },
      {
        eventId: 'edited',
        eventName: 'view_cart',
        recording: {
          title: 'view_cart',
          steps: [{ type: 'click', selectors: [['#my-cart']] }]
        }
      },
      {
        eventId: 'custom',
        eventName: 'sign_up',
        recording: { title: 'sign_up', steps: shippedAddToCartSteps }
      },
      { eventId: 'no-recording', eventName: 'purchase', recording: null }
    ]);

    await expect(service.refresh('example-project-slug')).resolves.toEqual([
      'add_to_cart'
    ]);

    const current = events['addToCart'].recording;
    expect(recordingRepositoryService.update).toHaveBeenCalledTimes(1);
    expect(recordingRepositoryService.update).toHaveBeenCalledWith(
      'example-project-slug',
      'shipped',
      { title: current.title, steps: current.steps }
    );
    expect(projectRecordingService.updateRecording).toHaveBeenCalledTimes(1);
    expect(projectRecordingService.updateRecording).toHaveBeenCalledWith(
      'example-project-slug',
      'shipped',
      current
    );
  });
});
