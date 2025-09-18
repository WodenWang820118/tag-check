import { Exclude, Expose, Transform, Type } from 'class-transformer';
import { FullTestEventSchema } from '@utils';
import { TestEventDetailResponseDto } from '../test-event-detail';
import { TestImageResponseDto } from '../test-image';
import { ProjectResponseDto } from '../project';
import { SpecResponseDto } from '../spec';
import { RecordingResponseDto } from '../recording';
import { TestImageEntity } from '../../entity';

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
  @Type(() => TestImageResponseDto)
  testImage!: TestImageResponseDto[];

  @Expose()
  @Type(() => ProjectResponseDto)
  project!: ProjectResponseDto;

  @Expose()
  @Type(() => SpecResponseDto)
  spec!: SpecResponseDto;

  @Expose()
  @Type(() => RecordingResponseDto)
  recording!: RecordingResponseDto;

  @Expose()
  @Type(() => TestImageResponseDto)
  @Transform(({ obj }) => {
    const testImages = Array.isArray(obj.testImage)
      ? (obj.testImage as TestImageEntity[])
      : [];
    const latestImage = testImages.find(
      (img) => img.id === obj.latestTestImageId
    );
    console.log('Latest image:', latestImage?.imageName);
    return latestImage ?? new TestImageResponseDto();
  })
  latestTestImage!: TestImageResponseDto;
}
