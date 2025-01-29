import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  TestEventEntity,
  CreateTestEventDto,
  UpdateTestEventDto
} from '../../../shared';

@Injectable()
export class TestEventRepositoryService {
  constructor(
    @InjectRepository(TestEventEntity)
    private readonly repository: Repository<TestEventEntity>
  ) {}

  async list(id: number) {
    return this.repository.find({ where: { id } });
  }

  async listReports(projectSlug: string) {
    return await this.repository.find({
      relations: {
        testInfo: true,
        testRequestInfo: true,
        testDataLayer: true,
        testImage: true,
        project: true
      },
      where: {
        project: {
          projectSlug
        }
      }
    });
  }

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async getByEventId(eventId: string) {
    return this.repository.findOne({ where: { eventId } });
  }

  async create(data: CreateTestEventDto) {
    return this.repository.save(data);
  }

  async update(data: UpdateTestEventDto) {
    return this.repository.save(data);
  }

  async delete(eventId: string) {
    return this.repository.delete(eventId);
  }

  async deleteByProjectSlugAndEventId(projectSlug: string, eventId: string) {
    return this.repository.delete({ project: { projectSlug }, eventId });
  }

  async deleteByProjectSlugAndEventIds(
    projectSlug: string,
    eventIds: string[]
  ) {
    try {
      return this.repository.delete({
        project: { projectSlug },
        eventId: In(eventIds)
      });
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
    }
  }

  async deleteMany(eventIds: string[]) {
    return this.repository.delete(eventIds);
  }
}
