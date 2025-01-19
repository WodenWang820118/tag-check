import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('image_result')
export class ImageResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventId!: string;

  @Column()
  name!: string;

  @Column('blob')
  data!: Buffer;

  @Column()
  size!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
