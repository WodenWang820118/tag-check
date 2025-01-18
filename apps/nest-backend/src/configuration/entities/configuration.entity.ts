import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('configurations')
export class Configuration {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  title!: string;

  @Column()
  description!: string;

  @Column()
  value!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
}
