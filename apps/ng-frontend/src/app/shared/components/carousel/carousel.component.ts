import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  output,
  signal
} from '@angular/core';
import { CarouselItem, CarouselItemEnum } from '@utils';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MediaPreviewDialogComponent } from '../media-preview-dialog/media-preview-dialog.component';

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnDestroy {
  private readonly sanitizer = inject(DomSanitizer);
  private readonly dialog = inject(MatDialog);
  private readonly objectUrls: string[] = [];
  imageBlob = input<Blob | undefined>(undefined);
  videoBlob = input<Blob | undefined>(undefined);

  // Helper method to generate a safe URL from a Blob.
  private getSafeUrl(blob: Blob): SafeUrl {
    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.push(objectUrl);
    return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
  }

  imageType = CarouselItemEnum.Image;
  videoType = CarouselItemEnum.Video;

  readonly items = computed(() => {
    const items: CarouselItem[] = [];
    const imgBlob = this.imageBlob();
    const vidBlob = this.videoBlob();
    if (imgBlob !== undefined) {
      items.push({
        type: CarouselItemEnum.Image,
        url: this.getSafeUrl(imgBlob)
      });
    }

    if (vidBlob !== undefined) {
      items.push({
        type: CarouselItemEnum.Video,
        url: this.getSafeUrl(vidBlob)
      });
    }

    console.warn('items: ', items);
    return items;
  });

  // Convert currentIndex to signal
  currentIndex = signal(0);

  next(): void {
    const items = this.items();
    if (!items?.length) return;

    this.currentIndex.update((current) => (current + 1) % items.length);
  }

  previous(): void {
    const items = this.items();
    if (!items?.length) return;

    this.currentIndex.update(
      (current) => (current - 1 + items.length) % items.length
    );
  }

  isActive(index: number): boolean {
    return this.currentIndex() === index;
  }

  ngOnDestroy(): void {
    this.objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  openPreview(index: number) {
    const items = this.items();
    if (!items?.length) return;
    const item = items[index];
    if (!item) return;
    // Determine the blob to pass for better download support
    item.type === CarouselItemEnum.Image ? this.imageBlob() : this.videoBlob();
    this.dialog.open(MediaPreviewDialogComponent, {
      data: {
        type: item.type,
        url: item.url as string,
        blob:
          item.type === CarouselItemEnum.Image
            ? this.imageBlob()
            : this.videoBlob(),
        alt: item.alt,
        caption: item.caption
      },
      panelClass: 'media-preview-panel',
      autoFocus: false,
      restoreFocus: true,
      maxWidth: '95vw',
      width: 'fit-content'
    });
  }
}
