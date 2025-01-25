import { ImageSchema } from '@utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('image_result')
export class ImageResult implements ImageSchema {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventId!: string;

  @Column()
  imageName!: string;

  @Column('blob')
  imageData!: Buffer;

  @Column()
  imageSize!: number;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
