import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  signal,
  ChangeDetectionStrategy
} from '@angular/core';
import { CarouselItem, CarouselItemEnum } from '@utils';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MediaPreviewDialogComponent } from '../media-preview-dialog/media-preview-dialog.component';

/** A carousel item with the blob it shows, for previews and downloads. */
type MediaItem = CarouselItem & { blob: Blob; testId: string };

@Component({
  selector: 'app-carousel',
  standalone: true,
  imports: [MatDialogModule],
  templateUrl: './carousel.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnDestroy {
  private readonly dialog = inject(MatDialog);
  private readonly objectUrls: string[] = [];
  imageBlob = input<Blob | undefined>(undefined);
  videoBlob = input<Blob | undefined>(undefined);
  /** The Tag Assistant tab recorded by an accompanied-mode run. */
  tagAssistantVideoBlob = input<Blob | undefined>(undefined);

  // Angular does not sanitize img/source src, so bind the blob: URL as a
  // plain string: a SafeUrl would be set as the text "SafeValue must use...".
  private getObjectUrl(blob: Blob): string {
    const objectUrl = URL.createObjectURL(blob);
    this.objectUrls.push(objectUrl);
    return objectUrl;
  }

  imageType = CarouselItemEnum.Image;
  videoType = CarouselItemEnum.Video;

  readonly items = computed(() => {
    const items: MediaItem[] = [];
    const imgBlob = this.imageBlob();
    const vidBlob = this.videoBlob();
    const tagAssistantBlob = this.tagAssistantVideoBlob();
    const hasTagAssistant = !!tagAssistantBlob && tagAssistantBlob.size > 0;
    if (imgBlob !== undefined) {
      items.push({
        type: CarouselItemEnum.Image,
        url: this.getObjectUrl(imgBlob),
        blob: imgBlob,
        testId: 'media-open-screenshot'
      });
    }

    if (vidBlob !== undefined) {
      items.push({
        type: CarouselItemEnum.Video,
        url: this.getObjectUrl(vidBlob),
        blob: vidBlob,
        testId: 'media-open-recording',
        caption: hasTagAssistant ? 'Website' : undefined
      });
    }

    if (hasTagAssistant) {
      items.push({
        type: CarouselItemEnum.Video,
        url: this.getObjectUrl(tagAssistantBlob),
        blob: tagAssistantBlob,
        testId: 'media-open-tag-assistant',
        caption: 'Tag Assistant'
      });
    }

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
    for (const url of this.objectUrls) {
      URL.revokeObjectURL(url);
    }
  }

  openPreview(index: number) {
    const items = this.items();
    if (!items?.length) return;
    const item = items[index];
    if (!item) return;
    this.dialog.open(MediaPreviewDialogComponent, {
      data: {
        type: item.type,
        url: item.url,
        blob: item.blob,
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
