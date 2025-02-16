import { Exclude, Expose } from 'class-transformer';
import { DataLayerSpec, StrictDataLayerEvent } from '@utils';

@Exclude()
export class AbstractSpecResponseDto implements DataLayerSpec {
  @Expose()
  dataLayerSpec!: StrictDataLayerEvent;

  @Expose()
  eventName!: string;
}
