import {
  BaseDataLayerEvent,
  StrictDataLayerEvent,
  TestEventDetailSchema
} from '@utils';
import { AuditableEntity } from './common';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { TestEventEntity } from './test-event.entity';

@Entity('test_event_detail')
export class TestEventDetailEntity
  extends AuditableEntity
  implements TestEventDetailSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

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

  @Column('json', {
    name: 'reformed_data_layer',
    nullable: true
  })
  reformedDataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;

  @Column({
    name: 'destination_url',
    type: 'varchar'
  })
  destinationUrl!: string;

  @Column('json', {
    name: 'data_layer',
    nullable: true
  })
  dataLayer?: StrictDataLayerEvent | BaseDataLayerEvent;
}
