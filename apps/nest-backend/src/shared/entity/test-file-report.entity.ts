import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { AuditableEntity } from './common';
import { TestEventEntity } from './test-event.entity';

@Entity('test_file_report')
export class TestFileReportEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @JoinColumn({ name: 'testEventId' })
  @ManyToOne(() => TestEventEntity, (testEvent) => testEvent.id)
  testEvent!: TestEventEntity;
}
