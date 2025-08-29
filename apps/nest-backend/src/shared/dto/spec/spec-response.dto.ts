import { Exclude, Expose } from 'class-transformer';
import { Spec, StrictDataLayerEvent, TagSpec } from '@utils';

@Exclude()
export class SpecResponseDto implements TagSpec {
  @Expose()
  id!: number;

  @Expose()
  dataLayerSpec!: StrictDataLayerEvent;

  @Expose()
  rawGtmTag!: Spec;

  @Expose()
  event!: string;

  @Expose()
  eventName!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
