import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  signal,
  viewChild,
  type Signal,
  type WritableSignal
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RUN_RECORDINGS_KEPT, type RunMediaTimeline, type Step } from '@utils';

/** Seeking to a step starts this long before it acts, to show the lead-up. */
const STEP_LEAD_IN_SECONDS = 1;
/** How far the Tag Assistant video may drift before it is put back. */
const MAX_DRIFT_SECONDS = 0.25;

/** One recorded step as the player lists it. */
export type PlayerStep = {
  index: number;
  label: string;
  detail: string;
  /** Where the step acts in the site recording; null without a timeline. */
  atSeconds: number | null;
};

/** What a step does, in a few words, and its target. */
export function describeStep(step: Step): { label: string; detail: string } {
  const first = step.selectors?.[0];
  const selector =
    (Array.isArray(first) ? first[0] : first) ?? step.target ?? '';
  switch (step.type) {
    case 'setViewport':
      return {
        label: 'Set the window size',
        detail: `${String(step['width'] ?? '?')} × ${String(step['height'] ?? '?')}`
      };
    case 'navigate':
      return { label: 'Open', detail: step.url ?? '' };
    case 'click':
    case 'doubleClick':
      return { label: 'Click', detail: selector };
    case 'change':
      return { label: 'Type into', detail: selector };
    case 'hover':
      return { label: 'Hover', detail: selector };
    case 'keyDown':
    case 'keyUp':
      return { label: `Press ${step.key ?? 'a key'}`, detail: '' };
    case 'waitForElement':
      return { label: 'Wait for', detail: selector };
    default:
      return { label: step.type, detail: selector };
  }
}

/** Formats seconds as m:ss. */
export function formatClock(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * A run's two screen recordings, the site's and Tag Assistant's, played as
 * one: one play button and one position for both, and each recorded step
 * on the timeline to jump to. Without recordings it shows the run's
 * screenshot.
 */
@Component({
  selector: 'app-run-player',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './run-player.component.html',
  styleUrls: ['./run-player.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RunPlayerComponent {
  siteBlob = input<Blob | undefined>(undefined);
  tagAssistantBlob = input<Blob | undefined>(undefined);
  imageBlob = input<Blob | undefined>(undefined);
  timeline = input<RunMediaTimeline | null | undefined>(null);
  steps = input<Step[]>([]);

  readonly siteVideo = viewChild<ElementRef<HTMLVideoElement>>('siteVideo');
  readonly tagAssistantVideo =
    viewChild<ElementRef<HTMLVideoElement>>('tagAssistantVideo');
  readonly views = viewChild<ElementRef<HTMLElement>>('views');

  /** blob: URLs, bound as plain strings (Angular 22 renders a SafeUrl as text). */
  readonly siteUrl = signal<string | null>(null);
  readonly tagAssistantUrl = signal<string | null>(null);
  readonly imageUrl = signal<string | null>(null);

  readonly currentTime = signal(0);
  readonly duration = signal(0);
  readonly playing = signal(false);
  readonly keptRuns = RUN_RECORDINGS_KEPT;

  readonly playerSteps = computed<PlayerStep[]>(() => {
    const times = new Map(
      (this.timeline()?.steps ?? []).map((step) => [step.index, step.atMs])
    );
    return this.steps().map((step, index) => {
      const atMs = times.get(index);
      return {
        index,
        ...describeStep(step),
        atSeconds: atMs === undefined ? null : atMs / 1000
      };
    });
  });

  /** Steps placed on the timeline, as a share of the recording's length. */
  readonly markers = computed(() => {
    const duration = this.duration();
    if (duration <= 0) {
      return [];
    }
    // The window size is set as the page loads: its marker would sit on the
    // first navigation's.
    return this.playerSteps().flatMap((step) =>
      step.atSeconds === null || step.label === 'Set the window size'
        ? []
        : [
            {
              ...step,
              left: `${Math.min(100, (step.atSeconds / duration) * 100).toFixed(2)}%`
            }
          ]
    );
  });

  readonly clock = computed(
    () => `${formatClock(this.currentTime())} / ${formatClock(this.duration())}`
  );

  constructor() {
    this.bindUrl(this.siteBlob, this.siteUrl);
    this.bindUrl(this.tagAssistantBlob, this.tagAssistantUrl);
    this.bindUrl(this.imageBlob, this.imageUrl);
  }

  /** Plays or pauses both recordings. */
  togglePlay(): void {
    const site = this.siteVideo()?.nativeElement;
    if (!site) {
      return;
    }
    if (site.paused) {
      this.syncTagAssistant(site.currentTime);
      void site.play().catch(() => undefined);
      void this.tagAssistantVideo()
        ?.nativeElement.play()
        .catch(() => undefined);
    } else {
      site.pause();
      this.tagAssistantVideo()?.nativeElement.pause();
    }
  }

  /** Moves both recordings to `seconds` on the site recording. */
  seek(seconds: number): void {
    const site = this.siteVideo()?.nativeElement;
    if (!site) {
      return;
    }
    site.currentTime = seconds;
    this.currentTime.set(seconds);
    this.syncTagAssistant(seconds);
  }

  /** Jumps to just before a step acts and plays. */
  playStep(step: PlayerStep): void {
    if (step.atSeconds === null) {
      return;
    }
    this.seek(Math.max(0, step.atSeconds - STEP_LEAD_IN_SECONDS));
    const site = this.siteVideo()?.nativeElement;
    if (site?.paused) {
      this.togglePlay();
    }
  }

  /** Shows both recordings full screen, as they play side by side. */
  fullScreen(): void {
    void this.views()
      ?.nativeElement.requestFullscreen?.()
      .catch(() => undefined);
  }

  onScrub(event: Event): void {
    this.seek(Number((event.target as HTMLInputElement).value));
  }

  /**
   * Opens at the last step, the one the test is about, rather than the
   * blank page a recording starts with.
   */
  onMetadata(): void {
    const duration = this.siteVideo()?.nativeElement.duration ?? 0;
    this.duration.set(Number.isFinite(duration) ? duration : 0);
    const last = this.playerSteps().findLast((step) => step.atSeconds !== null);
    if (last?.atSeconds != null && this.currentTime() === 0) {
      this.seek(Math.max(0, last.atSeconds - STEP_LEAD_IN_SECONDS));
    }
  }

  onTimeUpdate(): void {
    const site = this.siteVideo()?.nativeElement;
    if (!site) {
      return;
    }
    this.currentTime.set(site.currentTime);
    const tagAssistant = this.tagAssistantVideo()?.nativeElement;
    if (
      tagAssistant &&
      !site.paused &&
      Math.abs(
        tagAssistant.currentTime - this.tagAssistantTime(site.currentTime)
      ) > MAX_DRIFT_SECONDS
    ) {
      this.syncTagAssistant(site.currentTime);
    }
  }

  onPlayState(playing: boolean): void {
    this.playing.set(playing);
    if (!playing) {
      this.tagAssistantVideo()?.nativeElement.pause();
    }
  }

  /** Where the Tag Assistant recording is when the site's is at `seconds`. */
  private tagAssistantTime(seconds: number): number {
    const offset = (this.timeline()?.tagAssistantOffsetMs ?? 0) / 1000;
    return Math.max(0, seconds - offset);
  }

  private syncTagAssistant(seconds: number): void {
    const tagAssistant = this.tagAssistantVideo()?.nativeElement;
    if (tagAssistant) {
      tagAssistant.currentTime = this.tagAssistantTime(seconds);
    }
  }

  /**
   * Keeps `url` at a blob: URL of `blob`, revoking the previous one when the
   * blob changes (another run) or the player goes. An empty file means the
   * run kept none.
   */
  private bindUrl(
    blob: Signal<Blob | undefined>,
    url: WritableSignal<string | null>
  ): void {
    effect((onCleanup) => {
      const current = blob();
      if (!current || current.size === 0) {
        url.set(null);
        return;
      }
      const objectUrl = URL.createObjectURL(current);
      url.set(objectUrl);
      onCleanup(() => URL.revokeObjectURL(objectUrl));
    });
  }
}
