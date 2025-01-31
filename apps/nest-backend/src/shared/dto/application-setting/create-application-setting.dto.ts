import { ApplicationSetting, Cookie, Gtm, LocalStorage } from '@utils';
import { IsJSON, IsOptional } from 'class-validator';

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
}
