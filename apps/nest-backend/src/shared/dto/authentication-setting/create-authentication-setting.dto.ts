import { Authentication } from '@utils';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateAuthenticationSettingDto implements Authentication {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
