import { TestEventSchema } from '@utils';
import { AuditableEntity } from './common';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { TestInfoEntity } from './test-info.entity';
import { TestRequestInfoEntity } from './test-request-info.entity';
import { TestImageEntity } from './test-image.entity';
import { TestDataLayerEntity } from './test-data-layer.entity';

@Entity('test_event')
export class TestEventEntity
  extends AuditableEntity
  implements TestEventSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @JoinColumn({ name: 'projectId' })
  @ManyToOne(() => ProjectEntity, (project) => project.id)
  project!: ProjectEntity;

  @OneToOne(() => TestInfoEntity, (testInfo) => testInfo.testEvent)
  testInfo!: TestInfoEntity;

  @OneToOne(
    () => TestRequestInfoEntity,
    (testRequestInfo) => testRequestInfo.testEvent
  )
  testRequestInfo!: TestRequestInfoEntity;

  @OneToOne(() => TestImageEntity, (testImage) => testImage.testEvent)
  testImage!: TestImageEntity;

  @OneToOne(
    () => TestDataLayerEntity,
    (testDataLayer) => testDataLayer.testEvent
  )
  testDataLayer!: TestDataLayerEntity;

  @Column()
  eventId!: string;

  @Column()
  eventName!: string;

  @Column()
  testName!: string;

  @Column({ nullable: true })
  stopNavigation?: boolean;

  @Column({ nullable: true })
  message?: string;
}
