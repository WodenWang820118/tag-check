import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { ProjectInfo } from '@utils';
import { ProjectEntity } from './project.entity';

@Entity('project_info')
export class ProjectInfoEntity extends AuditableEntity implements ProjectInfo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  rootProject!: string;

  @Column()
  projectName!: string;

  @Column()
  projectSlug!: string;

  @Column()
  projectDescription!: string;

  @Column()
  measurementId!: string;

  @Column()
  googleSpreadsheetLink!: string;

  @Column()
  version!: string;

  @OneToOne(() => ProjectEntity, (project) => project.info)
  @JoinColumn({ name: 'projectId' })
  project!: ProjectEntity;
}
