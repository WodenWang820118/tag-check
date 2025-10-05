export interface Destination {
  id: string;
  country: string;
  city: string;
  latitude: number;
  longitude: number;
  description: string;
  title: string;
  smallTitle: string;
  image1: string;
  image1AuthorInfo: string;
  image2: string;
  image2AuthorInfo: string;
  image3: string;
  image3AuthorInfo: string;
  imageBig: string;
  imageBigAuthorInfo: string;
  price: number;
  video: string;
}

export class DestinationDto implements Destination {
  constructor(
    public id: string,
    public country: string,
    public city: string,
    public latitude: number,
    public longitude: number,
    public description: string,
    public title: string,
    public smallTitle: string,
    public image1: string,
    public image1AuthorInfo: string,
    public image2: string,
    public image2AuthorInfo: string,
    public image3: string,
    public image3AuthorInfo: string,
    public imageBig: string,
    public imageBigAuthorInfo: string,
    public price: number,
    public video: string
  ) {}
}
