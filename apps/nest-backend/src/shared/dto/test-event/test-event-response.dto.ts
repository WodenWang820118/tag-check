import { Exclude, Expose } from 'class-transformer';
import { TestEventSchema } from '@utils';

@Exclude()
export class TestEventResponseDto implements TestEventSchema {
  @Expose()
  id!: number;

  @Expose()
  eventId!: string;

  @Expose()
  testName!: string;

  @Expose()
  eventName!: string;

  @Expose()
  stopNavigation?: boolean;

  @Expose()
  message?: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date;
}
