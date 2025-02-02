import {
  BaseDataLayerEvent,
  DataLayerSpecSchema,
  StrictDataLayerEvent
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

@Entity('spec')
export class SpecEntity extends AuditableEntity implements DataLayerSpecSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.spec, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'testEventId' })
  testEvent!: TestEventEntity;

  @Column()
  eventName!: string;

  @Column('json')
  dataLayerSpec!: StrictDataLayerEvent | BaseDataLayerEvent;
}
