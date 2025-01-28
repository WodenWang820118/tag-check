import { Exclude, Expose } from 'class-transformer';
import { SpecSchema } from '@utils';

@Exclude()
export class SpecResponseDto implements SpecSchema {
  @Expose()
  id!: number;

  @Expose()
  projectSlug!: string;

  @Expose()
  event!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
