import {
  Component,
  computed,
  inject,
  input,
  OnDestroy,
  signal
} from '@angular/core';
import { CarouselItem, CarouselItemEnum } from '@utils';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-carousel',
  standalone: true,
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent implements OnDestroy {
  private sanitizer = inject(DomSanitizer);
  private objectUrls: string[] = [];
  imageBlob = input<Blob | null>(null);
  videoBlob = input<Blob | null>(null);

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
    if (imgBlob !== null) {
      items.push({
        type: CarouselItemEnum.Image,
        url: this.getSafeUrl(imgBlob)
      });
    }

    if (vidBlob !== null) {
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
}
