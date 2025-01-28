import { Recording, RecordingSchema } from '@utils';
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
export class RecordingEntity
  extends AuditableEntity
  implements RecordingSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('json')
  steps!: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  @JoinColumn({ name: 'projectId' })
  @ManyToOne(() => ProjectEntity, (project) => project.recordings)
  project!: ProjectEntity;
}
