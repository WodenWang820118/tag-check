import { ApiProperty } from '@nestjs/swagger';
import {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
  ValidationResult,
} from '@utils';

export class ValidationResultDto implements ValidationResult {
  @ApiProperty({
    description: 'Indicates whether the validation passed or failed',
  })
  passed: boolean;

  @ApiProperty({ description: 'A message describing the validation result' })
  message: string;

  @ApiProperty({
    description: 'The data layer specification used for validation',
  })
  dataLayerSpec: StrictDataLayerEvent | BaseDataLayerEvent;

  @ApiProperty({
    description: 'The actual data layer event being validated',
    required: false,
  })
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;

  constructor(
    passed: boolean,
    message: string,
    dataLayerSpec: StrictDataLayerEvent,
    dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent
  ) {
    this.passed = passed;
    this.message = message;
    this.dataLayerSpec = dataLayerSpec;
    this.dataLayer = dataLayer;
  }
}
