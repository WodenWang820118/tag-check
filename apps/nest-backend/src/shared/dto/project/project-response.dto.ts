import { ProjectSchema } from '@utils';
import { Exclude, Expose } from 'class-transformer';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  RecordingEntity,
  SpecEntity,
  TestEventEntity
} from '../../entity';

@Exclude()
export class ProjectResponseDto implements ProjectSchema {
  @Expose()
  id!: number;

  @Expose()
  projectSlug!: string;

  @Expose()
  projectName!: string;

  @Expose()
  projectDescription?: string | undefined;

  @Expose()
  measurementId?: string | undefined;

  @Expose()
  specs!: SpecEntity[];

  @Expose()
  recordings!: RecordingEntity[];

  @Expose()
  testEvents!: TestEventEntity[];

  @Expose()
  authenticationSettings!: AuthenticationSettingEntity;

  @Expose()
  browserSettings!: BrowserSettingEntity;

  @Expose()
  applicationSettings!: ApplicationSettingEntity;

  @Expose()
  createdAt!: Date;

  @Expose()
  updatedAt?: Date | undefined;
}
