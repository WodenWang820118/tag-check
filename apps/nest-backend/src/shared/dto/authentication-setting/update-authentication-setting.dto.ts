import { PartialType } from '@nestjs/mapped-types';
import { CreateAuthenticationSettingDto } from './create-authentication-setting.dto';

export class UpdateAuthenticationSettingDto extends PartialType(
  CreateAuthenticationSettingDto
) {}
