import { Exclude, Expose } from 'class-transformer';
import { RecordingSchema } from '@utils';

@Exclude()
export class RecordingResponseDto implements RecordingSchema {
  @Expose()
  id!: number;

  @Expose()
  title!: string;

  @Expose()
  steps!: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
