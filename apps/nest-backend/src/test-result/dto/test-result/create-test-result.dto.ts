import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTestResultDto {
  @IsNotEmpty()
  @IsString()
  position!: number;

  @IsNotEmpty()
  @IsString()
  eventId!: string;

  @IsNotEmpty()
  @IsString()
  testName!: string;

  @IsNotEmpty()
  @IsString()
  eventName!: string;

  @IsNotEmpty()
  @IsString()
  passed!: boolean;

  @IsNotEmpty()
  @IsString()
  requestPassed!: boolean;

  @IsNotEmpty()
  @IsString()
  incorrectInfo!: string;

  @IsNotEmpty()
  @IsString()
  completedTime!: Date;

  @IsNotEmpty()
  @IsString()
  rawRequest!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsNotEmpty()
  @IsString()
  destinationUrl!: string;
}
