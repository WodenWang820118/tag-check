import { ImageSchema } from '@utils';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { TestEventEntity } from './test-event.entity';

@Entity('test-image')
export class TestImageEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  imageName!: string;

  @Column('blob')
  imageData!: Buffer;

  @Column()
  imageSize!: number;

  @JoinColumn({ name: 'testEventId' })
  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.id)
  testEvent!: TestEventEntity;
}
