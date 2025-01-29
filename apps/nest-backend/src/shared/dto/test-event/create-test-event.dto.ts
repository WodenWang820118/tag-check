import { TestEvent } from '@utils';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTestEventDto implements TestEvent {
  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsOptional()
  @IsString()
  message?: string;
}
