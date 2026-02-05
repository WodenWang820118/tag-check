import { Exclude, Expose } from 'class-transformer';
import type { SysConfigurationSchema } from '@utils';

@Exclude()
export class SysConfigurationResponseDto implements SysConfigurationSchema {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  value!: string;

  @Expose()
  description?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
