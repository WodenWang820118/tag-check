import { Exclude, Expose, Transform } from 'class-transformer';
import { AbstractTestEvent, Recording, Spec } from '@utils';
import { TestEventDetailEntity } from '../../entity';

@Exclude()
export class AbstractTestEventResponseDto implements AbstractTestEvent {
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

  @Exclude()
  recording?: Recording;

  @Exclude()
  spec?: Spec;

  @Expose()
  @Transform(({ obj }) => {
    // Check if recording exists and has steps
    const testEvent = obj as AbstractTestEventResponseDto;
    return (
      testEvent.recording &&
      Array.isArray(testEvent.recording.steps) &&
      testEvent.recording.steps.length > 0
    );
  })
  hasRecording!: boolean;

  @Expose()
  @Transform(({ obj }) => {
    const eventDetails = obj.testEventDetails as TestEventDetailEntity[];
    const latestedEventDetail = eventDetails.find(
      (item) => item.id === obj.latestTestEventDetailId
    );
    return latestedEventDetail?.passed ?? false;
  })
  passed!: boolean;

  @Expose()
  @Transform(({ obj }) => {
    const eventDetails = obj.testEventDetails as TestEventDetailEntity[];
    const latestedEventDetail = eventDetails.find(
      (item) => item.id === obj.latestTestEventDetailId
    );
    return latestedEventDetail?.requestPassed ?? false;
  })
  requestPassed!: boolean;
}
