import type {
  BaseDataLayerEvent,
  RunMediaTimeline,
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

  /**
   * Whether the run made the GA4 request check: Request Check was on in the
   * project's GTM settings. Runs saved before this was recorded read as
   * true. A run without it is judged by its data layer check alone.
   */
  @Column({
    name: 'request_checked',
    type: 'boolean',
    default: true
  })
  requestChecked!: boolean;

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

  /** The GA4 request check's message; null when the run did not check it. */
  @Column({ name: 'request_message', type: 'text', nullable: true })
  requestMessage?: string | null;

  /**
   * Names the folder of the run's screen recordings
   * (`inspection_results/<eventId>/runs/<key>`), chosen when the run starts:
   * the row's id does not exist yet then, and changes when a project is
   * imported. Null once the run is past RUN_RECORDINGS_KEPT, and for runs
   * saved before runs kept their own recordings.
   */
  @Column({
    name: 'recording_key',
    type: 'varchar',
    length: 36,
    nullable: true
  })
  recordingKey?: string | null;

  /** When the run's steps acted on its recording; see RunMediaTimeline. */
  @Column('json', { name: 'media_timeline', nullable: true })
  mediaTimeline?: RunMediaTimeline | null;

  /**
   * The screenshot taken at the end of the run, so deleting a run deletes
   * it. Null for runs saved before runs were linked to their screenshot.
   */
  @OneToOne(() => TestImageEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'test_image_id' })
  testImage?: TestImageEntity | null;
}
