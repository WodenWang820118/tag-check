import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateProjectDto,
  ProjectEntity,
  ProjectResponseDto,
  UpdateProjectDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

/** Reads and writes projects (`ProjectEntity`). */
@Injectable()
export class ProjectRepositoryService {
  constructor(
    @InjectRepository(ProjectEntity)
    private readonly repository: Repository<ProjectEntity>
  ) {}

  /** The project with this id, or an empty DTO when there is none. */
  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(ProjectResponseDto, entity);
  }

  async list() {
    const entity = await this.repository.find();
    return plainToInstance(ProjectResponseDto, entity);
  }

  async getBySlug(slug: string) {
    const entity = await this.getEntityBySlug(slug);
    return plainToInstance(ProjectResponseDto, entity);
  }

  /** @throws HttpException 404 when no project has this slug. */
  async getEntityBySlug(slug: string) {
    const entity = await this.repository.findOne({
      where: { projectSlug: slug }
    });
    if (!entity) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return entity;
  }

  /** The project with its authentication, browser and application settings. */
  async getSettingBySlug(slug: string) {
    const entity = await this.repository.findOne({
      relations: {
        authenticationSettings: true,
        browserSettings: true,
        applicationSettings: true
      },
      where: { projectSlug: slug }
    });

    return plainToInstance(ProjectResponseDto, entity);
  }

  async create(data: CreateProjectDto): Promise<ProjectResponseDto> {
    const entity = await this.repository.save(data);
    return plainToInstance(ProjectResponseDto, entity);
  }

  /**
   * Updates the project's own columns.
   *
   * @returns The updated project. The settings page reads an empty body as
   * a failed save.
   * @throws HttpException 404 when no project has this id.
   */
  async update(id: number, data: UpdateProjectDto) {
    await this.repository.update(id, data);
    const entity = await this.repository.findOne({ where: { id } });
    if (!entity) {
      throw new HttpException('Project not found', HttpStatus.NOT_FOUND);
    }
    return plainToInstance(ProjectResponseDto, entity);
  }

  async deleteBySlug(slug: string) {
    const entity = await this.repository.delete({ projectSlug: slug });
    return plainToInstance(ProjectResponseDto, entity);
  }

  async getGtmConfigBySlug(slug: string) {
    const entity = await this.getEntityBySlug(slug);
    return entity.gtmConfigurationPath;
  }
}
