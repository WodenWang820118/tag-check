import {
  Component,
  computed,
  inject,
  input,
  linkedSignal,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CarouselItem, CarouselItemEnum } from '@utils';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MediaPreviewDialogComponent } from '../media-preview-dialog/media-preview-dialog.component';

/** A carousel item with the blob it shows, for previews and downloads. */
type MediaItem = CarouselItem & { blob: Blob; testId: string };

/**
 * The run's screenshot and recordings, one at a time; a click opens a
 * preview. Each blob gets one object URL, revoked once the blob leaves the
 * inputs or the carousel is destroyed.
 */
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
  private objectUrls = new Map<Blob, string>();
  imageBlob = input<Blob | undefined>(undefined);
  videoBlob = input<Blob | undefined>(undefined);
  /** The Tag Assistant tab recorded by an accompanied-mode run. */
  tagAssistantVideoBlob = input<Blob | undefined>(undefined);

  imageType = CarouselItemEnum.Image;
  videoType = CarouselItemEnum.Video;

  readonly items = computed(() => {
    const items: Omit<MediaItem, 'url'>[] = [];
    const imgBlob = this.imageBlob();
    const vidBlob = this.videoBlob();
    const tagAssistantBlob = this.tagAssistantVideoBlob();
    const hasTagAssistant = !!tagAssistantBlob && tagAssistantBlob.size > 0;
    if (imgBlob !== undefined) {
      items.push({
        type: CarouselItemEnum.Image,
        blob: imgBlob,
        testId: 'media-open-screenshot'
      });
    }

    if (vidBlob !== undefined) {
      items.push({
        type: CarouselItemEnum.Video,
        blob: vidBlob,
        testId: 'media-open-recording',
        caption: hasTagAssistant ? 'Website' : undefined
      });
    }

    if (hasTagAssistant) {
      items.push({
        type: CarouselItemEnum.Video,
        blob: tagAssistantBlob,
        testId: 'media-open-tag-assistant',
        caption: 'Tag Assistant'
      });
    }

    const urls = this.updateObjectUrls(items.map((item) => item.blob));
    return items.map((item): MediaItem => ({
      ...item,
      url: urls.get(item.blob) ?? ''
    }));
  });

  /** The shown item; back to the first one whenever the items change. */
  readonly currentIndex = linkedSignal({
    source: this.items,
    computation: () => 0
  });

  /**
   * Keeps the URLs of blobs still shown, makes URLs for new ones and
   * revokes the rest. Angular does not sanitize img/source src, so the
   * template binds these blob: URLs as plain strings: a SafeUrl would be
   * set as the text "SafeValue must use...".
   */
  private updateObjectUrls(blobs: Blob[]): Map<Blob, string> {
    const next = new Map<Blob, string>();
    for (const blob of blobs) {
      next.set(blob, this.objectUrls.get(blob) ?? URL.createObjectURL(blob));
    }
    for (const [blob, url] of this.objectUrls) {
      if (!next.has(blob)) URL.revokeObjectURL(url);
    }
    this.objectUrls = next;
    return next;
  }

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
    for (const url of this.objectUrls.values()) {
      URL.revokeObjectURL(url);
    }
    this.objectUrls.clear();
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
