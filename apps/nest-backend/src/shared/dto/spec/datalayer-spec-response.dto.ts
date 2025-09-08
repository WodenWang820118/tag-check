import { Exclude, Expose } from 'class-transformer';
import { Spec, StrictDataLayerEvent } from '@utils';

@Exclude()
export class AbstractSpecResponseDto {
  @Expose()
  id!: number;

  @Expose()
  rawGtmTag!: Spec;

  @Expose()
  dataLayerSpec!: StrictDataLayerEvent;

  @Expose()
  eventName!: string;
}
