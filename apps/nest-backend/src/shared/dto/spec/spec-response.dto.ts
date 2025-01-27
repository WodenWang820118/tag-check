import { Exclude, Expose } from 'class-transformer';
import { Auditable, Spec } from '@utils';

@Exclude()
export class SpecResponseDto implements Spec, Auditable {
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
