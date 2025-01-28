import { TestInfo } from '@utils';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateTestInfoDto implements TestInfo {
  @IsString()
  @IsNotEmpty()
  testName!: string;

  @IsString()
  @IsNotEmpty()
  eventName!: string;

  @IsNotEmpty()
  @IsBoolean()
  passed!: boolean;
}
