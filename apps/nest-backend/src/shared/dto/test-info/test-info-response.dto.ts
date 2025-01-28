import { Exclude, Expose } from 'class-transformer';
import { TestInfoSchema } from '@utils';

@Exclude()
export class TestInfoResponseDto implements TestInfoSchema {
  @Expose()
  id!: number;

  @Expose()
  testName!: string;

  @Expose()
  eventName!: string;

  @Expose()
  passed!: boolean;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
