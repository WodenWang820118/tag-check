import { Spec } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { AuditableEntity } from './common';

@Entity('spec')
export class SpecEntity extends AuditableEntity implements Spec {
  @PrimaryGeneratedColumn()
  id!: number;

  @JoinColumn({ name: 'projectId' })
  @ManyToOne(() => ProjectEntity, (project) => project.specs)
  project!: ProjectEntity;

  @Column()
  event!: string;

  @Column('json')
  specData!: Spec;
}
