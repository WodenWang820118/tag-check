import type { BatchRunItemStatus } from '@utils';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { BatchRunEntity } from './batch-run.entity';
import { TestEventEntity } from './test-event.entity';
import { TestEventDetailEntity } from './test-event-detail.entity';

/**
 * One test of a batch. Deleting the test deletes the item; deleting the
 * run's result (from the Reports page) keeps the item without its result.
 */
@Entity('batch_run_item')
export class BatchRunItemEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @ManyToOne(() => BatchRunEntity, (batchRun) => batchRun.items, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'batch_run_id' })
  batchRun!: BatchRunEntity;

  @Index()
  @ManyToOne(() => TestEventEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'test_event_id' })
  testEvent!: TestEventEntity;

  /** 0-based; items run in this order. */
  @Column({ name: 'position', type: 'int' })
  position!: number;

  @Index()
  @Column({ name: 'status', type: 'varchar', length: 20 })
  status!: BatchRunItemStatus;

  /** Why the item ended in error or was cancelled. */
  @Column({ name: 'message', type: 'text', nullable: true })
  message!: string | null;

  @Column({ name: 'started_at', type: 'datetime', nullable: true })
  startedAt!: Date | null;

  @Column({ name: 'finished_at', type: 'datetime', nullable: true })
  finishedAt!: Date | null;

  /** The saved result of the item's run. */
  @Column({ name: 'test_event_detail_id', type: 'int', nullable: true })
  testEventDetailId!: number | null;

  @ManyToOne(() => TestEventDetailEntity, {
    onDelete: 'SET NULL',
    nullable: true
  })
  @JoinColumn({ name: 'test_event_detail_id' })
  testEventDetail?: TestEventDetailEntity | null;
}
