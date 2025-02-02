import { Exclude, Expose } from 'class-transformer';
import {
  BaseDataLayerEvent,
  DataLayerSpecSchema,
  Spec,
  StrictDataLayerEvent
} from '@utils';

@Exclude()
export class SpecResponseDto implements DataLayerSpecSchema, Spec {
  @Expose()
  id!: number;

  @Expose()
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;

  @Expose()
  event!: string;

  @Expose()
  eventName!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
