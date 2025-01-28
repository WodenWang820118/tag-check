import { TestImage } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTestImageDto implements TestImage {
  @IsNotEmpty()
  @IsString()
  imageName!: string;

  @IsNotEmpty()
  imageData!: Uint8Array;

  imageSize?: number;
}
