import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsString, IsOptional } from 'class-validator';
import {
  StrictDataLayerEvent,
  BaseDataLayerEvent,
  ValidationResult
} from '@utils';

export class ValidationResultDto implements ValidationResult {
  @ApiProperty({
    description: 'Indicates whether the validation passed or failed'
  })
  @IsBoolean()
  passed!: boolean;

  @ApiProperty({ description: 'A message describing the validation result' })
  @IsString()
  message?: string;

  @ApiProperty({ description: 'The name of the event being validated' })
  @IsString()
  eventName!: string;

  @ApiProperty({
    description: 'The data layer specification used for validation'
  })
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;

  @ApiProperty({
    description: 'The actual data layer event being validated',
    required: false
  })
  @IsOptional()
  dataLayer!: StrictDataLayerEvent | BaseDataLayerEvent;

  constructor(partial: Partial<ValidationResultDto> = {}) {
    Object.assign(this, partial);
  }
}
