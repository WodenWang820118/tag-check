import {
  BaseDataLayerEvent,
  DataLayerSpec,
  Spec,
  StrictDataLayerEvent
} from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

// keep the frontend type to Spec while using DataLayerEvent in the backend
export class CreateSpecDto implements DataLayerSpec, Spec {
  @IsNotEmpty()
  @IsString()
  event!: string;

  @IsString()
  eventName!: string;

  @IsNotEmpty()
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;
}
