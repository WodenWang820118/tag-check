import { TestEventSchema } from '@utils';
import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { TestImageEntity } from './test-image.entity';
import { TestEventDetailEntity } from './test-event-detail.entity';
import { SpecEntity } from './spec.entity';
import { RecordingEntity } from './recording.entity';

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
  @JoinColumn({ name: 'recording_id' })
  recording!: RecordingEntity;

  @OneToOne(() => SpecEntity, (spec) => spec.testEvent, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'spec_id' })
  spec!: SpecEntity;

  @OneToMany(() => TestEventDetailEntity, (detail) => detail.testEvent, {
    onDelete: 'CASCADE'
  })
  testEventDetails!: TestEventDetailEntity[]; // Changed to plural for collection

  @OneToOne(() => TestImageEntity, (testImage) => testImage.testEvent, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'test_image_id' })
  testImage!: TestImageEntity;

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
