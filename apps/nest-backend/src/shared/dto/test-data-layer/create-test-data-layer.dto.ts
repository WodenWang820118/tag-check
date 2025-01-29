import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  TestDataLayer
} from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTestDataLayerDto implements TestDataLayer {
  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsNotEmpty()
  @IsString()
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent | undefined;
}
