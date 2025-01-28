import { BroswerSetting } from '@utils';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class CreateBrowserSettingDto implements BroswerSetting {
  @IsArray()
  @IsString({ each: true })
  browser?: string[];

  @IsBoolean()
  headless = true;
}
