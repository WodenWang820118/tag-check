import { ApplicationSettingSchema, Cookie, Gtm, LocalStorage } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import type { ProjectEntity } from './project.entity';
import { AuditableEntity } from './common';
import { Expose } from 'class-transformer';

@Entity('application_setting')
export class ApplicationSettingEntity
  extends AuditableEntity
  implements ApplicationSettingSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Expose({ name: 'localStorage' })
  @Column({
    name: 'local_storage_config',
    type: 'json',
    nullable: false,
    comment: 'Local storage configuration settings'
  })
  localStorage!: LocalStorage;

  @Expose({ name: 'cookie' })
  @Column({
    name: 'cookie_config',
    type: 'json',
    nullable: true,
    comment: 'Cookie configuration settings'
  })
  cookie!: Cookie;

  @Expose({ name: 'gtm' })
  @Column({
    name: 'gtm_config',
    type: 'json',
    nullable: true,
    comment: 'Google Tag Manager configuration settings'
  })
  gtm!: Gtm;

  @OneToOne('ProjectEntity', 'applicationSettings', { onDelete: 'CASCADE' })
  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id'
  })
  project!: ProjectEntity;

  @Column({
    name: 'website_url',
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Website URL'
  })
  @Expose({ name: 'websiteUrl' })
  websiteUrl!: string;
}
