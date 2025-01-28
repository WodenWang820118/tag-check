import { TestEventSchema } from '@utils';
import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';

@Entity('test_event')
export class TestEventEntity
  extends AuditableEntity
  implements TestEventSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @JoinColumn({ name: 'projectId' })
  @ManyToOne(() => ProjectEntity, (project) => project.id)
  project!: ProjectEntity;

  @Column({ unique: true })
  eventId!: string;

  @Column()
  message?: string;
}
