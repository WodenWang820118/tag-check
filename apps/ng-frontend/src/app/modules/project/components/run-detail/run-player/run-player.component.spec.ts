import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RunMediaTimeline, Step } from '@utils';
import {
  describeStep,
  formatClock,
  RunPlayerComponent
} from './run-player.component';

const STEPS: Step[] = [
  { type: 'setViewport', width: 1404, height: 945 } as Step,
  { type: 'navigate', url: 'https://ng-gtm-sample.vercel.app/home' },
  { type: 'click', selectors: [['[data-testid="add-to-cart"]']] }
];
const TIMELINE: RunMediaTimeline = {
  steps: [
    { index: 0, atMs: 2000 },
    { index: 1, atMs: 2010 },
    { index: 2, atMs: 12000 }
  ],
  tagAssistantOffsetMs: 500
};

describe('RunPlayerComponent', () => {
  let objectUrls: string[];

  beforeEach(() => {
    objectUrls = [];
    let next = 0;
    vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
      const url = `blob:recording-${next++}`;
      objectUrls.push(url);
      return url;
    });
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation((url) => {
      objectUrls = objectUrls.filter((open) => open !== url);
    });
    // jsdom does not play media.
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function (
      this: HTMLMediaElement
    ) {
      Object.defineProperty(this, 'paused', {
        configurable: true,
        value: false
      });
      return Promise.resolve();
    });
    vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(function (
      this: HTMLMediaElement
    ) {
      Object.defineProperty(this, 'paused', {
        configurable: true,
        value: true
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function render(inputs: {
    site?: Blob;
    tagAssistant?: Blob;
    image?: Blob;
    timeline?: RunMediaTimeline | null;
  }) {
    TestBed.configureTestingModule({ imports: [RunPlayerComponent] });
    const fixture = TestBed.createComponent(RunPlayerComponent);
    fixture.componentRef.setInput('siteBlob', inputs.site);
    fixture.componentRef.setInput('tagAssistantBlob', inputs.tagAssistant);
    fixture.componentRef.setInput('imageBlob', inputs.image);
    fixture.componentRef.setInput('timeline', inputs.timeline ?? null);
    fixture.componentRef.setInput('steps', STEPS);
    fixture.detectChanges();
    const query = <T extends HTMLElement>(id: string) =>
      fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as T | null;
    return { fixture, query };
  }

  const blob = (content: string) => new Blob([content], { type: 'video/webm' });

  it('plays both recordings from one position, the Tag Assistant one by its offset', () => {
    const { fixture, query } = render({
      site: blob('site'),
      tagAssistant: blob('tag assistant'),
      timeline: TIMELINE
    });
    const site = query<HTMLVideoElement>('run-player-site');
    const tagAssistant = query<HTMLVideoElement>('run-player-tag-assistant');
    expect(site?.getAttribute('src')).toBe('blob:recording-0');
    expect(tagAssistant?.getAttribute('src')).toBe('blob:recording-1');

    query<HTMLButtonElement>('run-player-step-3')?.click();
    fixture.detectChanges();

    // One second before the click, and playing.
    expect(site?.currentTime).toBe(11);
    expect(tagAssistant?.currentTime).toBe(10.5);
    expect(site?.paused).toBe(false);
    expect(tagAssistant?.paused).toBe(false);

    fixture.componentInstance.togglePlay();
    expect(site?.paused).toBe(true);
    expect(tagAssistant?.paused).toBe(true);
  });

  it('puts the steps on the timeline, except the window size', () => {
    const { fixture } = render({ site: blob('site'), timeline: TIMELINE });
    const video = fixture.nativeElement.querySelector(
      'video'
    ) as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 40 });
    video.dispatchEvent(new Event('loadedmetadata'));
    fixture.detectChanges();

    const markers = [
      ...fixture.nativeElement.querySelectorAll('.player-marker')
    ] as HTMLElement[];
    expect(
      markers.map((marker) => [marker.textContent?.trim(), marker.style.left])
    ).toEqual([
      ['2', '5.02%'],
      ['3', '30%']
    ]);
    // It opens on the last step.
    expect(video.currentTime).toBe(11);
    expect(fixture.componentInstance.clock()).toBe('0:11 / 0:40');
  });

  it('shows the screenshot when the run kept no recording', () => {
    const { query } = render({
      site: new Blob(),
      image: new Blob(['png'], { type: 'image/png' })
    });

    expect(query('run-player-site')).toBeNull();
    expect(query('run-player-screenshot')?.getAttribute('src')).toBe(
      'blob:recording-0'
    );
    expect(query('run-player')?.textContent).toContain('latest 10 runs');
    // Without recordings the steps are a list, not buttons.
    expect(query('run-player-step-3')).toBeNull();
  });

  it('lets the blob: URLs go with the player', () => {
    const { fixture } = render({ site: blob('site'), image: blob('png') });
    expect(objectUrls).toHaveLength(2);

    fixture.destroy();

    expect(objectUrls).toEqual([]);
  });

  it('describes each kind of step', () => {
    expect(describeStep(STEPS[0])).toEqual({
      label: 'Set the window size',
      detail: '1404 × 945'
    });
    expect(describeStep(STEPS[2])).toEqual({
      label: 'Click',
      detail: '[data-testid="add-to-cart"]'
    });
    expect(describeStep({ type: 'change', selectors: ['#email'] })).toEqual({
      label: 'Type into',
      detail: '#email'
    });
    expect(describeStep({ type: 'keyDown', key: 'Enter' })).toEqual({
      label: 'Press Enter',
      detail: ''
    });
    expect(describeStep({ type: 'scroll', target: 'main' })).toEqual({
      label: 'scroll',
      detail: 'main'
    });
    expect(formatClock(75.4)).toBe('1:15');
  });
});
