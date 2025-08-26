import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { TestEventEntity } from './test-event.entity';

@Entity('item_def')
export class ItemDefEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => TestEventEntity, (testEvent) => testEvent.itemDef, {
    onDelete: 'CASCADE'
  })
  @JoinColumn({ name: 'test_event_id' })
  testEvent!: TestEventEntity;

  @Column({
    name: 'template_name',
    type: 'varchar',
    length: 255
  })
  templateName!: string;

  @Column({
    name: 'item_id',
    type: 'varchar',
    nullable: true
  })
  itemId!: string;

  @Column({
    name: 'full_item_def',
    type: 'json',
    nullable: true,
    comment: 'Stores the full item definition in JSON format'
  })
  fullItemDef!: any;
}
