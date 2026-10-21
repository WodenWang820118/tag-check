import type {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  TestEventDetailSchema
} from '@utils';
import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { TestEventEntity } from './test-event.entity';
import { TestImageEntity } from './test-image.entity';

@Entity('test_event_detail')
export class TestEventDetailEntity
  extends AuditableEntity
  implements TestEventDetailSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  // Runs are looked up by test; without an index SQLite scans the whole table.
  @Index()
  @ManyToOne(() => TestEventEntity, (testEvent) => testEvent.testEventDetails, {
    onDelete: 'CASCADE'
  })
  testEvent!: TestEventEntity;

  @Column({
    name: 'passed',
    type: 'boolean'
  })
  passed!: boolean;

  @Column({
    name: 'request_passed',
    type: 'boolean'
  })
  requestPassed!: boolean;

  @Column({
    name: 'raw_request',
    type: 'text',
    nullable: true
  })
  rawRequest?: string;

  @Column({
    name: 'destination_url',
    type: 'varchar'
  })
  destinationUrl!: string;

  @Column('json', {
    name: 'data_layer',
    nullable: true
  })
  dataLayer?: StrictDataLayerEvent[] | BaseDataLayerEvent[];

  /** The run's validation message; null for runs saved before it was kept. */
  @Column({ name: 'message', type: 'text', nullable: true })
  message?: string | null;

  /**
   * The screenshot taken at the end of the run, so deleting a run deletes
   * it. Null for runs saved before runs were linked to their screenshot.
   */
  @OneToOne(() => TestImageEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'test_image_id' })
  testImage?: TestImageEntity | null;
}
