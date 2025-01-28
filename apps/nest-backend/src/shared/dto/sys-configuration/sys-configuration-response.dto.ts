import { Exclude, Expose } from 'class-transformer';
import { SpecSchema, SysConfigurationSchema } from '@utils';

@Exclude()
export class SysConfigurationResponseDto implements SysConfigurationSchema {
  @Expose()
  id!: number;

  @Expose()
  name!: string;

  @Expose()
  value!: string;

  @Expose()
  description?: string | undefined;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
