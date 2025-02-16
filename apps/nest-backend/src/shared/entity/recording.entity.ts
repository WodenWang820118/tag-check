import { RecordingSchema } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { TestEventEntity } from './test-event.entity';

@Entity('recording')
export class RecordingEntity
  extends AuditableEntity
  implements RecordingSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'title',
    type: 'varchar',
    length: 255
  })
  title!: string;

  @Column({
    name: 'steps',
    type: 'json',
    comment: 'Array of recording steps containing action details'
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  steps!: any[];

  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.recording, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'test_event_id' })
  testEvent!: TestEventEntity;
}
