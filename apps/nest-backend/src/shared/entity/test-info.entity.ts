import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { TestEventEntity } from './test-event.entity';
import { TestInfoSchema } from '@utils';

@Entity('test_info')
export class TestInfoEntity extends AuditableEntity implements TestInfoSchema {
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
