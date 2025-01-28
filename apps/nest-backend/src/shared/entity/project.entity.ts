import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { SpecEntity } from './spec.entity';
import { AuditableEntity } from './common';
import { RecordingEntity } from './recording.entity';
import { ProjectInfoEntity } from './project-info.entity';
import { ProjectSchema } from '@utils';
import { AuthenticationSettingEntity } from './authentication-setting.entity';
import { BrowserSettingEntity } from './browser-setting.entity';
import { ApplicationSettingEntity } from './application-setting.entity';
import { TestEventEntity } from './test-event.entity';

@Entity('project')
export class ProjectEntity extends AuditableEntity implements ProjectSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ nullable: false, unique: true, type: 'varchar', length: 255 })
  projectSlug!: string;

  @OneToOne(() => ProjectInfoEntity, (info) => info.project)
  info!: ProjectInfoEntity;

  @OneToMany(() => SpecEntity, (spec) => spec.project)
  specs!: SpecEntity[];

  @OneToMany(() => RecordingEntity, (recording) => recording.project)
  recordings!: RecordingEntity[];

  @OneToMany(() => TestEventEntity, (testEvent) => testEvent.project)
  testEvents!: TestEventEntity[];

  @OneToOne(() => AuthenticationSettingEntity, (auth) => auth.project)
  authenticationSettings!: AuthenticationSettingEntity;

  @OneToOne(() => BrowserSettingEntity, (browser) => browser.project)
  browserSettings!: BrowserSettingEntity;

  @OneToOne(() => ApplicationSettingEntity, (app) => app.project)
  applicationSettings!: ApplicationSettingEntity;
}
