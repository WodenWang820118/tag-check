import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { TestEventEntity } from './test-event.entity';
import { TestRequestInfoSchema } from '@utils';

@Entity('test_request_info')
export class TestRequestInfoEntity
  extends AuditableEntity
  implements TestRequestInfoSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @JoinColumn({ name: 'testEventId' })
  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.id)
  testEvent!: TestEventEntity;

  @Column()
  rawRequest!: string;

  @Column()
  destinationUrl!: string;

  @Column()
  requestPassed!: boolean;
}
