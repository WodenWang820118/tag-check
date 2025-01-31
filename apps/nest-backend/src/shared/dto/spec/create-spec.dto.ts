import { BaseDataLayerEvent, Spec, StrictDataLayerEvent } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSpecDto {
  @IsNotEmpty()
  @IsString()
  eventName!: string;

  @IsNotEmpty()
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;
}
