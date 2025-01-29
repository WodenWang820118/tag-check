import {
  BaseDataLayerEvent,
  DataLayerSchema,
  StrictDataLayerEvent,
  TestDataLayerSchema
} from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { TestEventEntity } from './test-event.entity';

@Entity('test_data_layer')
export class TestDataLayerEntity
  extends AuditableEntity
  implements TestDataLayerSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('json', { nullable: true })
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;

  @JoinColumn({ name: 'testEventId' })
  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.id)
  testEvent!: TestEventEntity;
}
