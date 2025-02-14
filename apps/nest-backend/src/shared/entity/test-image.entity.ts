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
  @PrimaryGeneratedColumn('uuid')
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

  @ManyToOne(() => TestEventEntity, (testEvent) => testEvent.testImage, {
    onDelete: 'CASCADE'
  })
  testEvent!: TestEventEntity;
}
