import type {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
  RunMediaTimeline,
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
  rawRequest?: string;

  @Expose()
  destinationUrl!: string;

  @Expose()
  dataLayer?: StrictDataLayerEvent[] | BaseDataLayerEvent[];

  @Expose()
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;

  @Expose()
  message?: string;

  @Expose()
  requestMessage?: string | null;

  @Expose()
  mediaTimeline?: RunMediaTimeline | null;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
