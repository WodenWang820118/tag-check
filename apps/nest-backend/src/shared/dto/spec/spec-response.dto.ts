import { Exclude, Expose } from 'class-transformer';
import { StrictDataLayerEvent } from '@utils';

@Exclude()
export class SpecResponseDto {
  @Expose()
  id!: number;

  @Expose()
  dataLayerSpec?: StrictDataLayerEvent;

  @Expose()
  event!: string;

  @Expose()
  eventName!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
