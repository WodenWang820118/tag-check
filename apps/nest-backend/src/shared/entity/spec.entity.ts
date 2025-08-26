import { Spec, StrictDataLayerEvent } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { TestEventEntity } from './test-event.entity';

@Entity('spec')
export class SpecEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.spec, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'test_event_id' })
  testEvent!: TestEventEntity;

  @Column({
    name: 'event_name',
    type: 'varchar',
    length: 255
  })
  eventName!: string;

  @Column({
    name: 'data_layer_spec',
    type: 'json',
    nullable: true,
    comment: 'Stores the data layer specification in JSON format'
  })
  dataLayerSpec?: StrictDataLayerEvent;

  @Column({
    name: 'raw_gtm_tag',
    type: 'json',
    nullable: true,
    comment: 'Stores the raw GTM tag in JSON format'
  })
  rawGtmTag?: Spec;
}
