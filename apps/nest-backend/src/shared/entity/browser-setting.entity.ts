import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { BrowserSettingSchema } from '@utils';
import { AuditableEntity } from './common';

@Entity('browser_settings')
export class BrowserSettingEntity
  extends AuditableEntity
  implements BrowserSettingSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('simple-array', { nullable: true })
  browser?: string[];

  @Column()
  headless!: boolean;

  @OneToOne(() => ProjectEntity, (project) => project.id)
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;
}
