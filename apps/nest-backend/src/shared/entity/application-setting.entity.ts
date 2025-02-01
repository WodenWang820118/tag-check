import { ApplicationSettingSchema, Cookie, Gtm, LocalStorage } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { AuditableEntity } from './common';

@Entity('application_settings')
export class ApplicationSettingEntity
  extends AuditableEntity
  implements ApplicationSettingSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('json')
  localStorage!: LocalStorage;

  @Column('json', { nullable: true })
  cookie!: Cookie;

  @Column('json', { nullable: true })
  gtm!: Gtm;

  @OneToOne(() => ProjectEntity, (project) => project.applicationSettings, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;
}
