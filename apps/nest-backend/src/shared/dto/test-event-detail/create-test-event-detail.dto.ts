import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  TestEventDetail
} from '@utils';
import { Expose } from 'class-transformer';
import {
  IsBoolean,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString
} from 'class-validator';

export class CreateTestEventDetailDto implements TestEventDetail {
  @IsOptional()
  @IsJSON()
  dataLayer?: StrictDataLayerEvent[] | BaseDataLayerEvent[];

  @IsNotEmpty()
  @IsBoolean()
  @Expose({ name: 'request_passed' })
  requestPassed!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  passed!: boolean;

  @IsOptional()
  rawRequest?: string | undefined;

  @IsOptional()
  @IsJSON()
  reformedDataLayer?: StrictDataLayerEvent[] | BaseDataLayerEvent[];

  @IsString()
  destinationUrl!: string;
}
