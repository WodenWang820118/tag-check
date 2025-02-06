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

@Entity('application_setting')
export class ApplicationSettingEntity
  extends AuditableEntity
  implements ApplicationSettingSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'local_storage_config',
    type: 'json',
    nullable: false,
    comment: 'Local storage configuration settings'
  })
  localStorage!: LocalStorage;

  @Column({
    name: 'cookie_config',
    type: 'json',
    nullable: true,
    comment: 'Cookie configuration settings'
  })
  cookie!: Cookie;

  @Column({
    name: 'gtm_config',
    type: 'json',
    nullable: true,
    comment: 'Google Tag Manager configuration settings'
  })
  gtm!: Gtm;

  @OneToOne(() => ProjectEntity, (project) => project.applicationSettings, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id'
  })
  project!: ProjectEntity;
}
