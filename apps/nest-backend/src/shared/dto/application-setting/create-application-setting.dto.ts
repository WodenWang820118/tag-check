import { ApplicationSetting, Cookie, Gtm, LocalStorage } from '@utils';
import { IsJSON } from 'class-validator';

export class CreateApplicationSettingDto implements ApplicationSetting {
  @IsJSON()
  localStorage!: LocalStorage;

  @IsJSON()
  cookie!: Cookie;

  @IsJSON()
  gtm!: Gtm;
}
