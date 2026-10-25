import type { BatchRunSource, BatchRunStatus } from '@utils';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { ProjectEntity } from './project.entity';
import { ScheduleEntity } from './schedule.entity';
import { BatchRunItemEntity } from './batch-run-item.entity';

/**
 * A batch of a project's tests, run one at a time by the backend's queue.
 * Batches run in the order they were created.
 */
@Entity('batch_run')
export class BatchRunEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'source', type: 'varchar', length: 20 })
  source!: BatchRunSource;

  /** The schedule that started the batch; null for a manual one. */
  @Column({ name: 'schedule_id', type: 'int', nullable: true })
  scheduleId!: number | null;

  @ManyToOne(() => ScheduleEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'schedule_id' })
  schedule?: ScheduleEntity | null;

  @Column({ name: 'headless', type: 'boolean' })
  headless!: boolean;

  @Index()
  @Column({ name: 'status', type: 'varchar', length: 20 })
  status!: BatchRunStatus;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  @OneToMany(() => BatchRunItemEntity, (item) => item.batchRun)
  items!: BatchRunItemEntity[];
}
