import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { SchedulePreset } from '@utils';
import { ProjectEntity, ScheduleEntity } from '../../../shared';

/** The columns of a schedule that can be written. */
export type ScheduleFields = SchedulePreset &
  Pick<
    ScheduleEntity,
    'name' | 'eventIds' | 'enabled' | 'lastRunAt' | 'nextRunAt'
  >;

/** Reads and writes schedules (`ScheduleEntity`), each with its project. */
@Injectable()
export class ScheduleRepositoryService {
  constructor(
    @InjectRepository(ScheduleEntity)
    private readonly repository: Repository<ScheduleEntity>
  ) {}

  async create(
    project: ProjectEntity,
    fields: ScheduleFields
  ): Promise<ScheduleEntity> {
    const saved = await this.repository.save(
      this.repository.create({ project, ...fields })
    );
    return await this.getById(saved.id);
  }

  /** @throws HttpException 404 when there is no such schedule. */
  async getById(id: number): Promise<ScheduleEntity> {
    const schedule = await this.repository.findOne({
      relations: { project: true },
      where: { id }
    });
    if (!schedule) {
      throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
    }
    return schedule;
  }

  /** @throws HttpException 404 when the project has no such schedule. */
  async getForProject(
    projectSlug: string,
    id: number
  ): Promise<ScheduleEntity> {
    const schedule = await this.repository.findOne({
      relations: { project: true },
      where: { id, project: { projectSlug } }
    });
    if (!schedule) {
      throw new HttpException('Schedule not found', HttpStatus.NOT_FOUND);
    }
    return schedule;
  }

  /** The project's schedules, oldest first. */
  async listForProject(projectSlug: string): Promise<ScheduleEntity[]> {
    return await this.repository.find({
      relations: { project: true },
      where: { project: { projectSlug } },
      order: { id: 'ASC' }
    });
  }

  /** Every enabled schedule of every project, with its project. */
  async listEnabled(): Promise<ScheduleEntity[]> {
    return await this.repository.find({
      relations: { project: true },
      where: { enabled: true },
      order: { id: 'ASC' }
    });
  }

  async update(
    id: number,
    fields: Partial<ScheduleFields>
  ): Promise<ScheduleEntity> {
    await this.repository.update(id, fields);
    return await this.getById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }
}
