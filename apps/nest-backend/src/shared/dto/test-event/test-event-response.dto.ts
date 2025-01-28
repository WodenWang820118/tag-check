import { Exclude, Expose } from 'class-transformer';
import { TestEventSchema } from '@utils';

@Exclude()
export class TestEventResponseDto implements TestEventSchema {
  @Expose()
  id!: number;

  @Expose()
  eventId!: string;

  @Expose()
  message?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
