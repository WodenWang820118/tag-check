import { Exclude, Expose } from 'class-transformer';
import { TestRequestInfoSchema } from '@utils';

@Exclude()
export class TestRequestInfoResponseDto implements TestRequestInfoSchema {
  @Expose()
  id!: number;

  @Expose()
  requestPassed!: boolean;

  @Expose()
  rawRequest!: string;

  @Expose()
  destinationUrl!: string;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt!: Date;
}
