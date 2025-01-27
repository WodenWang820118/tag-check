import { TestSchema } from '@utils';
import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { TestEventEntity } from './test-event.entity';

@Entity('test_info')
export class TestInfoEntity extends AuditableEntity implements TestSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @JoinColumn({ name: 'testEventId' })
  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.id)
  testEvent!: TestEventEntity;

  @Column()
  testName!: string;

  @Column()
  eventName!: string;

  @Column()
  passed!: boolean;
}
