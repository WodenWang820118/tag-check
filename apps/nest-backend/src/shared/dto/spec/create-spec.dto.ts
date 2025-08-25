import { StrictDataLayerEvent } from '@utils';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

// DTO used to create a SpecEntity; supports new GTM JSON and legacy dataLayerSpec
export class CreateSpecDto {
  @IsNotEmpty()
  @IsString()
  event!: string;

  @IsString()
  eventName!: string;

  @IsOptional()
  dataLayerSpec?: StrictDataLayerEvent;
}
