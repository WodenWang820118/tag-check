import { Recording } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { ProjectEntity } from './project.entity';

@Entity('recording')
export class RecordingEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @JoinColumn({ name: 'projectId' })
  @ManyToOne(() => ProjectEntity, (project) => project.recordings)
  project!: ProjectEntity;

  @Column('json')
  recordingData!: Recording;
}
