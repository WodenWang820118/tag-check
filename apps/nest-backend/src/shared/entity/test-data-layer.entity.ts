import { DataLayerSchema } from '@utils';
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
export class TestDataLayerEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  dataLayer!: string;

  @Column()
  dataLayerSpec!: string;

  @JoinColumn({ name: 'testEventId' })
  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.id)
  testEvent!: TestEventEntity;
}
