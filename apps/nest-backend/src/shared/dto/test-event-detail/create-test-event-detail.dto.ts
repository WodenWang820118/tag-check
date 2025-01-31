import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  TestEventDetail
} from '@utils';
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
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent | undefined;

  @IsNotEmpty()
  @IsBoolean()
  requestPassed!: boolean;

  @IsNotEmpty()
  @IsBoolean()
  passed!: boolean;

  @IsOptional()
  rawRequest?: string | undefined;

  @IsOptional()
  @IsJSON()
  reformedDataLayer?: StrictDataLayerEvent | BaseDataLayerEvent | undefined;

  @IsString()
  destinationUrl!: string;
}
