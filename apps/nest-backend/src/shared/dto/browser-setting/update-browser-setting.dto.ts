import { PartialType } from '@nestjs/mapped-types';
import { CreateBrowserSettingDto } from './create-browser-setting.dto';

export class UpdateBrowserSettingDto extends PartialType(
  CreateBrowserSettingDto
) {}
