import { Exclude, Expose } from 'class-transformer';
import { ApplicationSettingSchema, Cookie, Gtm, LocalStorage } from '@utils';

@Exclude()
export class ApplicationSettingResponseDto implements ApplicationSettingSchema {
  @Expose()
  id!: number;

  @Expose()
  localStorage?: LocalStorage | undefined;

  @Expose()
  cookie?: Cookie | undefined;

  @Expose()
  gtm?: Gtm | undefined;

  @Expose()
  preventNavigationEvents?: string[] | undefined;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
