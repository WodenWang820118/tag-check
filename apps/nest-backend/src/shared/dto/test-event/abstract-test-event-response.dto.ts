import { Exclude, Expose, Transform } from 'class-transformer';
import { AbstractTestEvent, Recording, Spec } from '@utils';
import { TestEventEntity } from '../../entity';

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
    const testEvent = obj as TestEventEntity;
    return testEvent.latestTestEventDetail?.passed ?? false;
  })
  passed!: boolean;

  @Expose()
  @Transform(({ obj }) => {
    const testEvent = obj as TestEventEntity;
    return testEvent.latestTestEventDetail?.requestPassed ?? false;
  })
  requestPassed!: boolean;
}
