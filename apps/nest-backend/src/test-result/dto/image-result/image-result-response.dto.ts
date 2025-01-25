import { Exclude, Expose } from 'class-transformer';
import { ImageSchema } from '@utils';

@Exclude()
export class ImageResultResponseDto implements ImageSchema {
  @Expose()
  id!: number;

  @Expose()
  eventId!: string;

  @Expose()
  imageName!: string;

  @Expose()
  imageData!: Buffer;

  @Expose()
  imageSize!: number;

  @Expose()
  createdAt!: Date;
}
