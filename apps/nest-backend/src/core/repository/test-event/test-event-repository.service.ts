import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  TestEventEntity,
  CreateTestEventDto,
  UpdateTestEventDto,
  TestEventResponseDto,
  ProjectEntity
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TestEventRepositoryService {
  constructor(
    @InjectRepository(TestEventEntity)
    private readonly repository: Repository<TestEventEntity>
  ) {}

  async list(id: number) {
    const entity = await this.repository.find({ where: { id } });
    return plainToInstance(TestEventResponseDto, entity);
  }

  async listReports(projectSlug: string): Promise<TestEventResponseDto[]> {
    const entity = await this.repository.find({
      relations: {
        testEventDetail: true,
        testImage: true,
        project: true
      },
      where: { project: { projectSlug } }
    });
    return plainToInstance(TestEventResponseDto, entity);
  }

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(TestEventResponseDto, entity);
  }

  async getByEventId(eventId: string) {
    const entity = await this.repository.findOne({ where: { eventId } });
    return plainToInstance(TestEventResponseDto, entity);
  }

  async getEntityByEventId(eventId: string) {
    const entity = await this.repository.findOne({ where: { eventId } });
    if (!entity) {
      throw new HttpException('Test event not found', HttpStatus.NOT_FOUND);
    }
    return entity;
  }

  async create(projectEntity: ProjectEntity, data: CreateTestEventDto) {
    const testEvent = new TestEventEntity();
    testEvent.eventId = data.eventId;
    testEvent.testName = data.testName;
    testEvent.message = data.message;
    testEvent.project = projectEntity;
    const entity = await this.repository.save(testEvent);
    return plainToInstance(TestEventResponseDto, entity);
  }

  async update(data: UpdateTestEventDto) {
    const entity = await this.repository.save(data);
    return plainToInstance(TestEventResponseDto, entity);
  }

  async delete(eventId: string) {
    const entity = await this.repository.delete(eventId);
    return plainToInstance(TestEventResponseDto, entity);
  }

  async deleteByProjectSlugAndEventId(projectSlug: string, eventId: string) {
    const entity = await this.repository.delete({
      project: { projectSlug },
      eventId
    });
    return plainToInstance(TestEventResponseDto, entity);
  }

  async deleteByProjectSlugAndEventIds(
    projectSlug: string,
    eventIds: string[]
  ) {
    try {
      // Validate input
      if (!eventIds || !Array.isArray(eventIds)) {
        throw new HttpException(
          'eventIds must be an array',
          HttpStatus.BAD_REQUEST
        );
      }

      if (eventIds.length === 0) {
        throw new HttpException(
          'eventIds array cannot be empty',
          HttpStatus.BAD_REQUEST
        );
      }

      // Ensure all elements are strings
      const validatedEventIds = eventIds.map((id) => {
        if (typeof id !== 'string') {
          throw new HttpException(
            'All eventIds must be strings',
            HttpStatus.BAD_REQUEST
          );
        }
        return id;
      });

      // Delete all events
      const query = this.repository
        .createQueryBuilder('test_event')
        .leftJoinAndSelect('test_event.project', 'project')
        .where('project.projectSlug = :projectSlug', { projectSlug })
        .andWhere('test_event.eventId IN (:...eventIds)', {
          eventIds: validatedEventIds
        });
      const entity = await this.repository.remove(await query.getMany());
      return plainToInstance(TestEventResponseDto, entity);
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
    }
  }

  async deleteMany(eventIds: string[]) {
    const entity = await this.repository.delete(eventIds);
    return plainToInstance(TestEventResponseDto, entity);
  }
}
