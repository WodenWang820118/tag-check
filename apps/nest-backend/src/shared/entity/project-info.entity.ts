import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { ProjectEntity } from './project.entity';
import { ProjectInfoSchema } from '@utils';

@Entity('project_info')
export class ProjectInfoEntity
  extends AuditableEntity
  implements ProjectInfoSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  projectName!: string;

  @Column()
  projectDescription?: string;

  @Column()
  measurementId?: string;

  @OneToOne(() => ProjectEntity, (project) => project.info)
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;
}
