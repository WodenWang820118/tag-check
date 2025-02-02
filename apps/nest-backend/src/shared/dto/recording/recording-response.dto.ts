import { Exclude, Expose } from 'class-transformer';
import { RecordingSchema } from '@utils';

@Exclude()
export class RecordingResponseDto implements RecordingSchema {
  @Exclude()
  id!: number;

  @Expose()
  title!: string;

  @Expose()
  steps!: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  @Exclude()
  createdAt!: Date;

  @Exclude()
  updatedAt?: Date;
}
