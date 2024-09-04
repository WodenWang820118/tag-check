export interface CarouselItem {
  type: 'image' | 'video';
  url: string;
  alt?: string;
  caption?: string;
}
