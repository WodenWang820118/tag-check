import { TestRequestInfo } from '@utils';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class CreateTestRequestInfoDto implements TestRequestInfo {
  @IsBoolean()
  @IsNotEmpty()
  requestPassed!: boolean;

  @IsString()
  rawRequest?: string;

  @IsString()
  @IsNotEmpty()
  destinationUrl!: string;
}
