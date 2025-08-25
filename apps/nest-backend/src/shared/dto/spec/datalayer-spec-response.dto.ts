import { Exclude, Expose } from 'class-transformer';
import { StrictDataLayerEvent } from '@utils';

@Exclude()
export class AbstractSpecResponseDto {
  @Expose()
  dataLayerSpec!: StrictDataLayerEvent;

  @Expose()
  eventName!: string;
}
