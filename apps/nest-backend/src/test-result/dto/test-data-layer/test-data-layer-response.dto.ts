import { Exclude, Expose } from 'class-transformer';
import { DataLayerResult } from '@utils';

@Exclude()
export class TestDataLayerResponseDto implements DataLayerResult {
  @Expose()
  id!: number;

  @Expose()
  eventId!: string;

  @Expose()
  dataLayer!: string;

  @Expose()
  dataLayerSpec!: string;
}
