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

  @Column({ nullable: false })
  projectName!: string;

  @Column({ nullable: true })
  projectDescription?: string;

  @Column({ nullable: true })
  measurementId?: string;

  @OneToMany(() => SpecEntity, (spec) => spec.project)
  specs!: SpecEntity[];

  @OneToMany(() => TestEventEntity, (testEvent) => testEvent.project)
  testEvents!: TestEventEntity[];

  @OneToOne(() => AuthenticationSettingEntity, (auth) => auth.project)
  authenticationSettings!: AuthenticationSettingEntity;

  @OneToOne(() => BrowserSettingEntity, (browser) => browser.project)
  browserSettings!: BrowserSettingEntity;

  @OneToOne(() => ApplicationSettingEntity, (app) => app.project)
  applicationSettings!: ApplicationSettingEntity;
}
