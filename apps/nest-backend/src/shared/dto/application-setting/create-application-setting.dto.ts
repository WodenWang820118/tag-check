import { ApplicationSetting, Cookie, Gtm, LocalStorage } from '@utils';
import { IsArray, IsJSON, IsOptional, IsString } from 'class-validator';

export class CreateApplicationSettingDto implements ApplicationSetting {
  @IsJSON()
  @IsOptional()
  localStorage?: LocalStorage;

  @IsJSON()
  @IsOptional()
  cookie?: Cookie;

  @IsJSON()
  @IsOptional()
  gtm?: Gtm;

  // TODO: could be normalized into test events as preventNavigation boolean
  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  preventNavigationEvents?: string[];
}
