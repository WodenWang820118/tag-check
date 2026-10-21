import { Exclude, Expose, Transform } from 'class-transformer';
import type { AbstractTestEvent, Recording, Spec } from '@utils';

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
  message!: string;

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

  // The latest run's checks: load the latestTestEventDetail relation.
  @Expose()
  @Transform(({ obj }) => obj.latestTestEventDetail?.passed ?? false)
  passed!: boolean;

  @Expose()
  @Transform(({ obj }) => obj.latestTestEventDetail?.requestPassed ?? false)
  requestPassed!: boolean;
}
