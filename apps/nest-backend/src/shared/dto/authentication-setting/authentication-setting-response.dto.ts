import { Exclude, Expose } from 'class-transformer';
import { AuthenticationSchema } from '@utils';

@Exclude()
export class AuthenticationSettingResponseDto implements AuthenticationSchema {
  @Expose()
  id!: number;

  @Expose()
  username!: string;

  @Expose()
  password!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
