import { Exclude, Expose, Type } from 'class-transformer';
import type { FullTestEventSchema } from '@utils';
import { TestEventDetailResponseDto } from '../test-event-detail';
import { TestImageResponseDto } from '../test-image';
import { ProjectResponseDto } from '../project';
import { SpecResponseDto } from '../spec';
import { RecordingResponseDto } from '../recording';

@Exclude()
export class FullTestEventResponseDto implements FullTestEventSchema {
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

  @Expose()
  @Type(() => TestEventDetailResponseDto)
  testEventDetails!: TestEventDetailResponseDto;

  @Expose()
  @Type(() => ProjectResponseDto)
  project!: ProjectResponseDto;

  @Expose()
  @Type(() => SpecResponseDto)
  spec!: SpecResponseDto;

  @Expose()
  @Type(() => RecordingResponseDto)
  recording!: RecordingResponseDto;

  /** The latest run's result; testEventDetails holds every run. */
  @Expose()
  @Type(() => TestEventDetailResponseDto)
  latestTestEventDetail?: TestEventDetailResponseDto;

  /** The latest run's screenshot. Earlier screenshots are not loaded. */
  @Expose()
  @Type(() => TestImageResponseDto)
  latestTestImage?: TestImageResponseDto;
}
