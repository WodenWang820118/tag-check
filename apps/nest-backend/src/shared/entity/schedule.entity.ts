import type { ScheduleKind } from '@utils';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from 'typeorm';
import { AuditableEntity } from './common';
import { ProjectEntity } from './project.entity';

/**
 * A recurring run of some of a project's tests, from a preset: daily at
 * `time`, weekly on `weekdays` at `time`, or every `everyHours` hours. Each
 * run is a headless batch. Times are the backend machine's local time;
 * `lastRunAt` and `nextRunAt` are stored as UTC.
 */
@Entity('schedule')
export class ScheduleEntity extends AuditableEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index()
  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'project_id' })
  project!: ProjectEntity;

  @Column({ name: 'name', type: 'varchar', length: 255 })
  name!: string;

  /** The tests' eventIds, in run order; deleted tests are skipped at run time. */
  @Column({ name: 'event_ids', type: 'json' })
  eventIds!: string[];

  @Column({ name: 'kind', type: 'varchar', length: 20 })
  kind!: ScheduleKind;

  /** `HH:MM`, 24-hour; daily and weekly only. */
  @Column({ name: 'time', type: 'varchar', length: 5, nullable: true })
  time!: string | null;

  /** Sunday = 0 to Saturday = 6; weekly only. */
  @Column({ name: 'weekdays', type: 'json', nullable: true })
  weekdays!: number[] | null;

  /** 1 to 24; everyHours only. */
  @Column({ name: 'every_hours', type: 'int', nullable: true })
  everyHours!: number | null;

  @Column({ name: 'enabled', type: 'boolean', default: true })
  enabled!: boolean;

  @Column({ name: 'last_run_at', type: 'datetime', nullable: true })
  lastRunAt!: Date | null;

  /** Null while the schedule is disabled. */
  @Column({ name: 'next_run_at', type: 'datetime', nullable: true })
  nextRunAt!: Date | null;
}
