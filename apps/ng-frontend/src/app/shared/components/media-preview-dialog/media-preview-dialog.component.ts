import { Component, Inject, OnDestroy, inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { CarouselItemEnum } from '@utils';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export type MediaPreviewData = {
  type: CarouselItemEnum;
  // Prefer blob when available to manage object URL lifecycle locally.
  blob?: Blob;
  url?: string | SafeUrl;
  alt?: string;
  caption?: string;
};

@Component({
  selector: 'app-media-preview-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <div class="media-preview-dialog" role="dialog" aria-modal="true">
      <h2 class="sr-only">Media preview</h2>
      <div class="media-wrapper" [ngSwitch]="data.type">
        <img
          *ngSwitchCase="mediaTypes.Image"
          [src]="displayUrl"
          [alt]="data.alt || 'Preview image'"
          class="media-img"
        />
        <video
          *ngSwitchCase="mediaTypes.Video"
          controls
          class="media-video"
          autoplay
        >
          <source [src]="displayUrl || undefined" type="video/webm" />
          Your browser does not support the video tag.
        </video>
      </div>
      <div class="caption" *ngIf="data.caption">{{ data.caption }}</div>
      <div class="actions">
        <button mat-stroked-button type="button" (click)="download()">
          Download
        </button>
        <button
          mat-raised-button
          color="primary"
          type="button"
          (click)="close()"
        >
          Close
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .media-preview-dialog {
        width: min(90vw, 960px);
        max-height: 90vh;
        display: flex;
        flex-direction: column;
      }
      .media-wrapper {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #111;
      }
      .media-img,
      .media-video {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
      }
      .actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.5rem;
        padding-top: 0.5rem;
      }
      .caption {
        padding-top: 0.25rem;
        color: rgba(0, 0, 0, 0.7);
      }
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }
    `
  ]
})
export class MediaPreviewDialogComponent implements OnDestroy {
  mediaTypes = CarouselItemEnum;
  private readonly sanitizer = inject(DomSanitizer);
  private objectUrl: string | null = null;
  // Safe display URL used by template
  displayUrl: string | SafeUrl | null = null;

  constructor(
    private readonly dialogRef: MatDialogRef<MediaPreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MediaPreviewData
  ) {
    if (data.blob) {
      this.objectUrl = URL.createObjectURL(data.blob);
      this.displayUrl = this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
    } else if (data.url) {
      this.displayUrl = data.url;
    }
  }

  close() {
    this.dialogRef.close();
  }

  download() {
    // Create an anchor element to trigger download
    const a = document.createElement('a');
    if (this.data.blob) {
      const dlUrl = this.objectUrl ?? URL.createObjectURL(this.data.blob);
      a.href = dlUrl;
    } else {
      a.href = (this.data.url as string) ?? '';
    }
    const ts = new Date().toISOString().replaceAll(/[:.]/g, '-');
    const base =
      this.data.type === CarouselItemEnum.Image ? 'screenshot' : 'recording';
    const ext = this.data.type === CarouselItemEnum.Image ? 'png' : 'webm';
    a.download = `${base}-${ts}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = null;
    }
  }
}
