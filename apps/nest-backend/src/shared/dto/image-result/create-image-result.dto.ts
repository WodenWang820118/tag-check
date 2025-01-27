import { IsNotEmpty, IsString } from 'class-validator';

export class CreateImageResultDto {
  @IsNotEmpty()
  @IsString()
  imageName!: string;

  @IsNotEmpty()
  imageData!: Uint8Array;

  imageSize?: number;
}
