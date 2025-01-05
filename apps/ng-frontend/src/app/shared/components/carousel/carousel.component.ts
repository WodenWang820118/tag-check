import { Component, computed, input, signal } from '@angular/core';
import { CarouselItem, CarouselItemEnum } from '@utils';
import { BlobToUrlPipe } from '../../pipes/blob-to-url-pipe';

@Component({
  selector: 'app-carousel',
  standalone: true,
  templateUrl: './carousel.component.html',
  styleUrls: ['./carousel.component.scss']
})
export class CarouselComponent {
  imageBlob = input<Blob | null>(null);
  videoBlob = input<Blob | null>(null);

  readonly items = computed(() => {
    const items: CarouselItem[] = [];
    const imgBlob = this.imageBlob();
    const vidBlob = this.videoBlob();

    if (imgBlob !== null) {
      items.push({
        type: CarouselItemEnum.Image,
        url: new BlobToUrlPipe().transform(imgBlob) || ''
      });
    }

    if (vidBlob !== null) {
      items.push({
        type: CarouselItemEnum.Video,
        url: new BlobToUrlPipe().transform(vidBlob) || ''
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
}
