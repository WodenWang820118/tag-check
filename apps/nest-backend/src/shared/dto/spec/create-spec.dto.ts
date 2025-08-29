import { Spec, StrictDataLayerEvent, TagSpec } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

// DTO used to create a SpecEntity; supports new GTM JSON and legacy dataLayerSpec
export class CreateSpecDto implements TagSpec {
  @IsNotEmpty()
  @IsString()
  event!: string;

  @IsString()
  eventName!: string;

  @IsNotEmpty()
  dataLayerSpec!: StrictDataLayerEvent;

  @IsNotEmpty()
  rawGtmTag!: Spec;
}
