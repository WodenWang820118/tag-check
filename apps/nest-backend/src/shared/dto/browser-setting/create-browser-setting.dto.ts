import { BrowserSetting } from '@utils';
import { IsArray, IsBoolean, IsString } from 'class-validator';

export class CreateBrowserSettingDto implements BrowserSetting {
  @IsArray()
  @IsString({ each: true })
  browser!: string[];

  @IsBoolean()
  headless = true;
}
