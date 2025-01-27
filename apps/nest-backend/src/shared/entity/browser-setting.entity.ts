import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { BrowserSettingSchema } from '@utils';

@Entity('browser_settings')
export class BrowserSettingEntity implements BrowserSettingSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('simple-array')
  browser!: string[];

  @Column()
  headless!: boolean;

  @OneToOne(() => ProjectEntity, (project) => project.id)
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;
}
