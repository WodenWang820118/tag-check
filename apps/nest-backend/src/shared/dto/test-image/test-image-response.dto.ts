import { Exclude, Expose } from 'class-transformer';
import { TestImageSchema } from '@utils';

@Exclude()
export class TestImageResponseDto implements TestImageSchema {
  @Expose()
  id!: number;

  @Expose()
  eventId!: string;

  @Expose()
  imageName!: string;

  @Expose()
  imageData!: Buffer;

  @Expose()
  imageSize?: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
