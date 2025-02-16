import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
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
  @Column({
    name: 'project_slug',
    type: 'varchar',
    length: 255,
    nullable: false,
    unique: true
  })
  projectSlug!: string;

  @Column({
    name: 'project_name',
    type: 'varchar',
    length: 255,
    nullable: false
  })
  projectName!: string;

  @Column({
    name: 'project_description',
    type: 'text',
    nullable: true
  })
  projectDescription?: string;

  @Column({
    name: 'measurement_id',
    type: 'varchar',
    length: 100,
    nullable: true
  })
  measurementId?: string;

  @OneToMany(() => TestEventEntity, (testEvent) => testEvent.project, {
    onDelete: 'CASCADE'
  })
  testEvents!: TestEventEntity[];

  @OneToOne(() => AuthenticationSettingEntity, (auth) => auth.project, {
    onDelete: 'CASCADE'
  })
  authenticationSettings!: AuthenticationSettingEntity;

  @OneToOne(() => BrowserSettingEntity, (browser) => browser.project, {
    onDelete: 'CASCADE'
  })
  browserSettings!: BrowserSettingEntity;

  @OneToOne(() => ApplicationSettingEntity, (app) => app.project, {
    onDelete: 'CASCADE'
  })
  applicationSettings!: ApplicationSettingEntity;
}
