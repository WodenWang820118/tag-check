import { TestImageSchema } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { TestEventEntity } from './test-event.entity';

@Entity('test_image')
export class TestImageEntity
  extends AuditableEntity
  implements TestImageSchema
{
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    name: 'image_name',
    type: 'varchar'
  })
  imageName!: string;

  @Column({
    name: 'image_data',
    type: 'blob'
  })
  imageData!: Buffer;

  @Column({
    name: 'image_size',
    type: 'int',
    nullable: true
  })
  imageSize?: number;

  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.testImage, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'test_event_id' })
  testEvent!: TestEventEntity;
}
