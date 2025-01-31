import { Exclude, Expose } from 'class-transformer';
import { BaseDataLayerEvent, StrictDataLayerEvent } from '@utils';

@Exclude()
export class SpecResponseDto {
  @Expose()
  id!: number;

  @Expose()
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;

  @Expose()
  eventName!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
