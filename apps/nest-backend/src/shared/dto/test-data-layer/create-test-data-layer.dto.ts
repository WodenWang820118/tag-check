import { DataLayerResult } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTestDataLayerDto implements DataLayerResult {
  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsNotEmpty()
  @IsString()
  dataLayer?: string;

  @IsNotEmpty()
  @IsString()
  dataLayerSpec!: string;
}
