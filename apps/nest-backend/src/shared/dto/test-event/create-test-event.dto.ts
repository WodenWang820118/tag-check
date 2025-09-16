import { TestEvent } from '@utils';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTestEventDto implements TestEvent {
  @IsNotEmpty()
  @IsString()
  testName!: string;

  @IsNotEmpty()
  @IsString()
  eventName!: string;

  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsOptional()
  @IsString()
  message!: string;

  @IsOptional()
  @IsBoolean()
  stopNavigation?: boolean;

  @IsOptional()
  latestTestEventDetailId?: number;

  @IsOptional()
  latestTestImageId?: number;
}
