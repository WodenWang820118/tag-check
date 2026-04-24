export type DestinationImageSlot = 'imageBig' | 'image1' | 'image2' | 'image3';

export interface CreateDestinationDraft {
  country: string;
  city: string;
  title: string;
  smallTitle: string;
  latitude: number;
  longitude: number;
  description: string;
  price: number;
  video: string;
  imageBigAuthorInfo: string;
  image1AuthorInfo: string;
  image2AuthorInfo: string;
  image3AuthorInfo: string;
  files: Record<DestinationImageSlot, File>;
}
