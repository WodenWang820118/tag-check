import { Exclude, Expose } from 'class-transformer';
import { RecordingSchema, Step } from '@utils';

@Exclude()
export class RecordingResponseDto implements RecordingSchema {
  @Exclude()
  id!: number;

  @Expose()
  title!: string;

  @Expose()
  steps!: Step[];

  @Exclude()
  createdAt!: Date;

  @Exclude()
  updatedAt?: Date;
}
