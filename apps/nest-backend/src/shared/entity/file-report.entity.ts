import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { ProjectEntity } from './project.entity';
import { TestEventEntity } from './test-event.entity';

@Entity('file_report')
export class FileReportEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => ProjectEntity, (project) => project.fileReports, {
    onDelete: 'CASCADE',
    nullable: false
  })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @ManyToMany(() => TestEventEntity, (testEvent) => testEvent.fileReports)
  // @JoinTable({
  //   name: 'file_reports_test_events',
  //   joinColumn: {
  //     name: 'file_report_id',
  //     referencedColumnName: 'id'
  //   },
  //   inverseJoinColumn: {
  //     name: 'test_event_id',
  //     referencedColumnName: 'id'
  //   }
  // })
  testEvents!: TestEventEntity[];

  @Column({ name: 'file_name' })
  fileName!: string;
}
