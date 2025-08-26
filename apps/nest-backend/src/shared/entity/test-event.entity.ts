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
import { ItemDefEntity } from './item-def.entity';

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

  @OneToOne(() => ItemDefEntity, (itemDef) => itemDef.testEvent, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'item_def_id' })
  itemDef!: ItemDefEntity;

  @OneToMany(() => TestEventDetailEntity, (detail) => detail.testEvent, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'test_event_detail_id' })
  testEventDetails!: TestEventDetailEntity[];

  @OneToMany(() => TestImageEntity, (testImage) => testImage.testEvent, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'test_image_id' })
  testImage!: TestImageEntity[];

  @Column({ name: 'event_id', unique: true, type: 'varchar' })
  eventId!: string;

  @Column({ name: 'test_name', type: 'varchar' })
  testName!: string;

  @Column({ name: 'event_name', type: 'varchar' })
  eventName!: string;

  @Column({ name: 'stop_navigation', nullable: true, type: 'boolean' })
  stopNavigation?: boolean;

  @Column({ name: 'message', nullable: true, type: 'text' })
  message?: string;

  @Column({ name: 'latest_test_event_detail_id', nullable: true, type: 'int' })
  latestTestEventDetailId?: number | null;

  @Column({ name: 'latest_test_image_id', nullable: true, type: 'int' })
  latestTestImageId?: number | null;

  @OneToOne(() => TestEventDetailEntity)
  @JoinColumn({ name: 'latest_test_event_detail_id' })
  latestTestEventDetail?: TestEventDetailEntity;

  @OneToOne(() => TestImageEntity)
  @JoinColumn({ name: 'latest_test_image_id' })
  latestTestImage?: TestImageEntity;
}
