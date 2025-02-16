import { SafeUrl } from '@angular/platform-browser';
import { CarouselItemEnum } from '../../enums/tag-check';

export type CarouselItem = {
  type: CarouselItemEnum;
  url: string | SafeUrl;
  alt?: string;
  caption?: string;
};
