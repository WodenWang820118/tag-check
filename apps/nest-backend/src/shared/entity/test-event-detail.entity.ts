import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  TestEventDetailSchema
} from '@utils';
import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { TestEventEntity } from './test-event.entity';

@Entity('test_event_detail')
export class TestEventDetailEntity
  extends AuditableEntity
  implements TestEventDetailSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => TestEventEntity, (testEvent) => testEvent.testEventDetail, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'testEventId' })
  testEvent!: TestEventEntity;

  @Column()
  passed!: boolean;

  @Column()
  requestPassed!: boolean;

  @Column({ nullable: true })
  rawRequest?: string;

  @Column('json', { nullable: true })
  reformedDataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;

  @Column()
  destinationUrl!: string;

  @Column('json', { nullable: true })
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
}
