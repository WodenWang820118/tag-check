import { ImageSchema } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateImageResultDto implements ImageSchema {
  @IsNotEmpty()
  id!: number;

  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsNotEmpty()
  @IsString()
  imageName!: string;

  @IsNotEmpty()
  imageData!: Uint8Array;

  @IsNotEmpty()
  imageSize!: number;

  @IsNotEmpty()
  @IsString()
  createdAt!: Date;
}
