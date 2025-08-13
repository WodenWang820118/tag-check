import { SysConfiguration } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSysConfigurationDto implements SysConfiguration {
  @IsNotEmpty()
  @IsString()
  name!: string;

  @IsNotEmpty()
  @IsString()
  value!: string;

  @IsString()
  description?: string;
}
