import { Injectable, OnDestroy } from '@angular/core';
import { DataLayerGlobal } from '../../models/data-layer-event.model';

/**
 * The IFrame API player members this service reads
 * (https://developers.google.com/youtube/iframe_api_reference). `videoTitle`
 * is not in that reference; it is read as the player object exposes it.
 */
interface TrackedYoutubePlayer {
  getPlayerState(): number;
  getVideoUrl(): string;
  getCurrentTime(): number;
  getDuration(): number;
  videoTitle?: string;
}

/** `stateChange` event emitted by `<youtube-player>`. */
export interface YoutubeStateChangeEvent {
  target: TrackedYoutubePlayer;
}

@Injectable({
  providedIn: 'root'
})
export class YoutubeService implements OnDestroy {
  private progressInterval?: ReturnType<typeof setInterval> | null;
  private readonly youtubeEventRecords: Map<number, boolean> = new Map();

  trackVideoEvent(event: YoutubeStateChangeEvent): void {
    const playerState = event.target.getPlayerState();
    switch (playerState) {
      case -1:
        console.log('Video Unstarted');
        break;
      case 0:
        console.log('Video Ended');
        (globalThis as unknown as DataLayerGlobal).dataLayer.push({
          event: 'youtube_complete',
          videoTitle: event.target.videoTitle,
          videoUrl: event.target.getVideoUrl(),
          videoPercent: 100
        });
        break;
      case 1:
        console.log('Video Playing');
        this.startProgressTracking(event);
        break;
      case 2:
        console.log('Video Paused');
        break;
      case 3:
        console.log('Video Buffering');
        break;
      case 5:
        console.log('Video Cued');
        (globalThis as unknown as DataLayerGlobal).dataLayer.push({
          event: 'youtube_start',
          videoTitle: event.target.videoTitle,
          videoUrl: event.target.getVideoUrl(),
          videoPercent:
            event.target.getCurrentTime() / event.target.getDuration()
        });
        break;
      default:
        console.log('Video State Unknown');
        break;
    }
  }

  startProgressTracking(event: YoutubeStateChangeEvent): void {
    // Clear existing interval if any
    this.stopProgressTracking();

    // Set up a new interval
    this.progressInterval = setInterval(() => {
      this.trackVideoProgress(event);
    }, 1000); // Adjust interval as needed
  }

  stopProgressTracking(): void {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  trackVideoProgress(event: YoutubeStateChangeEvent): void {
    const videoPercent =
      event.target.getCurrentTime() / event.target.getDuration();
    this.checkAndTrackProgress(
      25,
      videoPercent >= 0.25 && videoPercent < 0.5,
      event
    );
    this.checkAndTrackProgress(
      50,
      videoPercent >= 0.5 && videoPercent < 0.75,
      event
    );
    this.checkAndTrackProgress(
      75,
      videoPercent >= 0.75 && videoPercent < 0.9,
      event
    );
  }

  private checkAndTrackProgress(
    label: number,
    condition: boolean,
    event: YoutubeStateChangeEvent
  ): void {
    if (condition && !this.youtubeEventRecords.get(label)) {
      console.log(`Video Progress ${label}`);
      this.youtubeEventRecords.set(label, true);
      (globalThis as unknown as DataLayerGlobal).dataLayer.push({
        event: 'youtube_progress',
        videoTitle: event.target.videoTitle,
        videoUrl: event.target.getVideoUrl(),
        videoPercent: label
      });
    }
  }

  ngOnDestroy(): void {
    // Ensure we clean up
    this.stopProgressTracking();
  }
}
