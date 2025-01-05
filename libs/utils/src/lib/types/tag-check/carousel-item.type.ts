import { CarouselItemEnum } from '../../enums/tag-check';

export type CarouselItem = {
  type: CarouselItemEnum;
  url: string;
  alt?: string;
  caption?: string;
};
