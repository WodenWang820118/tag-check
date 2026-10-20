import { CarouselItemEnum } from '../../enums/tag-check';

export type CarouselItem = {
  type: CarouselItemEnum;
  // A blob: object URL. Angular binds it to img/source src as a plain string.
  url: string;
  alt?: string;
  caption?: string;
};
