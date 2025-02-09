import { TestEventSchema } from '@utils';
import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { TestImageEntity } from './test-image.entity';
import { TestEventDetailEntity } from './test-event-detail.entity';
import { SpecEntity } from './spec.entity';
import { RecordingEntity } from './recording.entity';
import { FileReportEntity } from './file-report.entity';

@Entity('test_event')
export class TestEventEntity
  extends AuditableEntity
  implements TestEventSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProjectEntity, (project) => project.testEvents, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @OneToOne(() => RecordingEntity, (recording) => recording.testEvent, {
    onDelete: 'CASCADE'
  })
  recording!: RecordingEntity;

  @OneToOne(() => SpecEntity, (spec) => spec.testEvent, {
    onDelete: 'CASCADE'
  })
  spec!: SpecEntity;

  @OneToOne(() => TestEventDetailEntity, (detail) => detail.testEvent, {
    onDelete: 'CASCADE'
  })
  testEventDetails!: TestEventDetailEntity;

  @OneToOne(() => TestImageEntity, (testImage) => testImage.testEvent, {
    onDelete: 'CASCADE'
  })
  testImage!: TestImageEntity;

  @ManyToMany(() => FileReportEntity, (fileReport) => fileReport.testEvents)
  @JoinTable({
    name: 'test_events_file_reports',
    joinColumn: {
      name: 'test_event_id',
      referencedColumnName: 'id'
    },
    inverseJoinColumn: {
      name: 'file_report_id',
      referencedColumnName: 'id'
    }
  })
  fileReports!: FileReportEntity[];

  @Column({ name: 'event_id', unique: true })
  eventId!: string;

  @Column({ name: 'test_name' })
  testName!: string;

  @Column({ name: 'event_name' })
  eventName!: string;

  @Column({ name: 'stop_navigation', nullable: true })
  stopNavigation?: boolean;

  @Column({ name: 'message', nullable: true })
  message?: string;
}
