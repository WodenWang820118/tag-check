import { Exclude, Expose } from 'class-transformer';
import { BrowserSettingSchema } from '@utils';

@Exclude()
export class BrowserSettingResponseDto implements BrowserSettingSchema {
  @Expose()
  browser?: string[] | undefined;

  @Expose()
  headless!: boolean;

  @Expose()
  id!: number;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
