import {
  Component,
  inject,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

export interface VideoDialogData {
  blob: Blob;
}

@Component({
  selector: 'app-video-dialog',
  standalone: true,
  imports: [MatDialogModule],
  changeDetection: ChangeDetectionStrategy.Eager,
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
          <source [src]="url" type="video/webm" />
          <track kind="captions" srclang="en" label="English captions" />
        </video>
      </div>
    </div>
  `
})
export class VideoDialogComponent implements OnDestroy {
  private readonly dialogRef = inject(MatDialogRef<VideoDialogComponent>);
  private readonly data = inject<VideoDialogData>(MAT_DIALOG_DATA);
  // Angular does not sanitize img/source src, so bind the blob: URL as a
  // plain string: a SafeUrl would be set as the text "SafeValue must use...".
  private readonly objectUrl = URL.createObjectURL(this.data.blob);
  readonly url = this.objectUrl;

  ngOnDestroy(): void {
    URL.revokeObjectURL(this.objectUrl);
  }
}
