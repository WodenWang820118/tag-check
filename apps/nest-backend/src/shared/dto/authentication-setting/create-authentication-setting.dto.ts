import { AuthenticationSetting } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAuthenticationSettingDto implements AuthenticationSetting {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
