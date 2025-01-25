import { IsNotEmpty, IsString } from 'class-validator';
import { FileReport } from '@utils';

export class CreateTestResultDto implements FileReport {
  @IsNotEmpty()
  id!: number;

  @IsNotEmpty()
  @IsString()
  projectSlug!: string;

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
  rawRequest!: string;

  @IsNotEmpty()
  @IsString()
  message!: string;

  @IsNotEmpty()
  @IsString()
  destinationUrl!: string;

  @IsNotEmpty()
  @IsString()
  createdAt!: Date;
}
