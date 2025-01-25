import { Exclude, Expose } from 'class-transformer';
import { FileReport } from '@utils';

@Exclude()
export class TestResultResponseDto implements FileReport {
  @Expose()
  id!: number;

  @Expose()
  projectSlug!: string;

  @Expose()
  eventId!: string;

  @Expose()
  testName!: string;

  @Expose()
  eventName!: string;

  @Expose()
  passed!: boolean;

  @Expose()
  requestPassed!: boolean;

  @Expose()
  incorrectInfo!: string;

  @Expose()
  rawRequest!: string;

  @Expose()
  message!: string;

  @Expose()
  destinationUrl!: string;

  @Expose()
  createdAt!: Date;
}
