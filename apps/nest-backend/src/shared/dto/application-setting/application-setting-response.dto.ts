import { Exclude, Expose } from 'class-transformer';
import { ApplicationSettingSchema, Cookie, Gtm, LocalStorage } from '@utils';

@Exclude()
export class ApplicationSettingResponseDto implements ApplicationSettingSchema {
  @Expose()
  id!: number;

  @Expose()
  localStorage!: LocalStorage;

  @Expose()
  cookie!: Cookie;

  @Expose()
  gtm!: Gtm;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
