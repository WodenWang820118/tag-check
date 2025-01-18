import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class TestResultResponseDto {
  @Expose()
  position!: number;

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
  completedTime!: Date;

  @Expose()
  rawRequest!: string;

  @Expose()
  message!: string;

  @Expose()
  destinationUrl!: string;
}
