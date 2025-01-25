import { DataLayerResult } from '@utils';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('test_data_layer')
export class TestDataLayer implements DataLayerResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  eventId!: string;

  @Column()
  dataLayer!: string;

  @Column()
  dataLayerSpec!: string;
}
