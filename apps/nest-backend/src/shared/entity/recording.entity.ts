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

  @Column()
  title!: string;

  @Column('json')
  steps!: Record<string, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any

  @JoinColumn({ name: 'testEventId' })
  @OneToOne(() => TestEventEntity, (event) => event.id)
  testEvent!: TestEventEntity;
}
