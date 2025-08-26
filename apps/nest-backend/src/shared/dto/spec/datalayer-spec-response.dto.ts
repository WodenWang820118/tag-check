import { Exclude, Expose } from 'class-transformer';
import { Spec, StrictDataLayerEvent } from '@utils';

@Exclude()
export class AbstractSpecResponseDto {
  @Expose()
  rawGtmTag!: Spec;

  @Expose()
  dataLayerSpec!: StrictDataLayerEvent;

  @Expose()
  eventName!: string;
}
