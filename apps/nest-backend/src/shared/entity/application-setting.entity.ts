import {
  ApplicationSettingSchema,
  Authentication,
  Cookie,
  Gtm,
  LocalStorage
} from '@utils';
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

  @Column('json')
  cookie!: Cookie;

  @Column('json')
  gtm!: Gtm;

  @Column('json')
  authentication!: Authentication;

  @Column('simple-array')
  preventNavigationEvents!: string[];

  @OneToOne(() => ProjectEntity, (project) => project.id)
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;
}
