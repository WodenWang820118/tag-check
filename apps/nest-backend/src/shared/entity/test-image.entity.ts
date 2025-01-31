import { TestImageSchema } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
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

  @Column()
  imageName!: string;

  @Column('blob')
  imageData!: Buffer;

  @Column({ nullable: true })
  imageSize?: number;

  @JoinColumn({ name: 'testEventId' })
  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.testImage, {
    onDelete: 'CASCADE'
  })
  testEvent!: TestEventEntity;
}
