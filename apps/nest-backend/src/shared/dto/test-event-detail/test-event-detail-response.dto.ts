import {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
  TestEventDetailSchema
} from '@utils';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TestEventDetailResponseDto implements TestEventDetailSchema {
  @Expose()
  id!: number;

  @Expose()
  requestPassed!: boolean;

  @Expose()
  passed!: boolean;

  @Expose()
  rawRequest?: string | undefined;

  @Expose()
  reformedDataLayer?: StrictDataLayerEvent | BaseDataLayerEvent | undefined;

  @Expose()
  destinationUrl!: string;

  @Expose()
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent | undefined;

  @Expose()
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
