import { Exclude, Expose } from 'class-transformer';
import { ApplicationSettingSchema, Cookie, Gtm, LocalStorage } from '@utils';

@Exclude()
export class ApplicationSettingResponseDto implements ApplicationSettingSchema {
  @Expose()
  id!: number;

  @Expose({ name: 'local_storage_config' })
  localStorage!: LocalStorage;

  @Expose({ name: 'cookie_config' })
  cookie!: Cookie;

  @Expose({ name: 'gtm_config' })
  gtm!: Gtm;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
