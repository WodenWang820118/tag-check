import { ProjectSchema } from '@utils';
import { Exclude, Expose } from 'class-transformer';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ProjectInfoEntity,
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
  info!: ProjectInfoEntity;

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
