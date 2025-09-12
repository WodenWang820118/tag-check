import { Component, inject, OnDestroy } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

export interface VideoDialogData {
  blob: Blob;
}

@Component({
  selector: 'app-video-dialog',
  standalone: true,
  imports: [MatDialogModule],
  template: `
    <div class="w-full h-full flex flex-col">
      <header
        class="flex items-center justify-between p-2 border-b border-black/10"
      >
        <h2 class="text-base font-medium">Video Preview</h2>
        <button mat-dialog-close aria-label="Close dialog">✕</button>
      </header>
      <div class="flex-1 min-h-0">
        <video class="w-full h-full" controls autoplay>
          <source [src]="safeUrl" type="video/webm" />
          <track kind="captions" srclang="en" label="English captions" />
        </video>
      </div>
    </div>
  `
})
export class VideoDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<VideoDialogComponent>);
  private readonly data = inject<VideoDialogData>(MAT_DIALOG_DATA);
  private readonly sanitizer = inject(DomSanitizer);
  private objectUrl?: string;

  safeUrl: SafeUrl = this.createUrl(this.data.blob);

  private createUrl(blob: Blob): SafeUrl {
    this.objectUrl = URL.createObjectURL(blob);
    return this.sanitizer.bypassSecurityTrustUrl(this.objectUrl);
  }

  ngOnDestroy(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
  }
}
