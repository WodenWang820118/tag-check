import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('test_result')
export class TestResult {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  projectSlug!: string;

  @Column()
  eventId!: string;

  @Column()
  testName!: string;

  @Column()
  eventName!: string;

  @Column()
  passed!: boolean;

  @Column()
  requestPassed!: boolean;

  @Column()
  completedTime!: Date;

  @Column()
  rawRequest!: string;

  @Column()
  message!: string;

  @Column()
  destinationUrl!: string;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;
}
