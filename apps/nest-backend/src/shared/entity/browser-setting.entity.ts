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

@Entity('browser_setting')
export class BrowserSettingEntity
  extends AuditableEntity
  implements BrowserSettingSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'browser',
    type: 'json',
    nullable: true,
    comment: 'List of supported browsers'
  })
  browser!: string[];

  @Column({
    name: 'headless',
    type: 'boolean',
    default: false,
    comment: 'Whether to run browser in headless mode'
  })
  headless!: boolean;

  @OneToOne(() => ProjectEntity, (project) => project.browserSettings, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({
    name: 'project_id',
    referencedColumnName: 'id'
  })
  project!: ProjectEntity;
}
