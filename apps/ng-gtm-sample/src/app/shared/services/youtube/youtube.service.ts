import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class YoutubeService implements OnDestroy {
  private progressInterval: any;
  private readonly youtubeEventRecords: Map<number, boolean> = new Map();
  constructor() {}

  trackVideoEvent(event: any): void {
    const playerState = event.target.getPlayerState();
    switch (playerState) {
      case -1:
        console.log('Video Unstarted');
        break;
      case 0:
        console.log('Video Ended');
        (globalThis as any).dataLayer.push({
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
        (globalThis as any).dataLayer.push({
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

  startProgressTracking(event: any): void {
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

  trackVideoProgress(event: any): void {
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
    event: any
  ): void {
    if (condition && !this.youtubeEventRecords.get(label)) {
      console.log(`Video Progress ${label}`);
      this.youtubeEventRecords.set(label, true);
      (globalThis as any).dataLayer.push({
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
