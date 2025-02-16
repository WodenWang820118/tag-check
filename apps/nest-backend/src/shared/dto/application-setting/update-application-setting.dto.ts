import { PartialType } from '@nestjs/mapped-types';
import { CreateApplicationSettingDto } from './create-application-setting.dto';

export class UpdateApplicationSettingDto extends PartialType(
  CreateApplicationSettingDto
) {}
