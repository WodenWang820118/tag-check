import { Exclude, Expose } from 'class-transformer';
import {
  BaseDataLayerEvent,
  DataLayerSpec,
  StrictDataLayerEvent
} from '@utils';

@Exclude()
export class AbstractSpecResponseDto implements DataLayerSpec {
  @Expose()
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;

  @Expose()
  eventName!: string;
}
