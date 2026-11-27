import type {
  BaseDataLayerEvent,
  RunMediaTimeline,
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

  /** Whether the run made the GA4 request check; true when left out. */
  @IsOptional()
  @IsBoolean()
  requestChecked?: boolean;

  @IsNotEmpty()
  @IsBoolean()
  passed!: boolean;

  @IsOptional()
  rawRequest?: string;

  @IsString()
  destinationUrl!: string;

  /** The run's validation message, such as "Valid". */
  @IsOptional()
  @IsString()
  message?: string;

  /** The GA4 request check's message, when the run checked the request. */
  @IsOptional()
  @IsString()
  requestMessage?: string | null;

  /** The folder name of the run's recordings; see TestEventDetailEntity. */
  @IsOptional()
  @IsString()
  recordingKey?: string | null;

  @IsOptional()
  mediaTimeline?: RunMediaTimeline | null;
}
