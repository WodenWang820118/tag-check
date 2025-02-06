import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  TestEventEntity,
  CreateTestEventDto,
  UpdateTestEventDto,
  AbstractTestEventResponseDto,
  ProjectEntity,
  FullTestEventResponseDto
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
    return plainToInstance(AbstractTestEventResponseDto, entity);
  }

  async listReports(
    projectSlug: string
  ): Promise<AbstractTestEventResponseDto[]> {
    const entities = await this.repository.find({
      relations: {
        testEventDetails: true,
        testImage: true,
        project: true,
        recording: true,
        spec: true
      },
      where: { project: { projectSlug } }
    });
    return plainToInstance(AbstractTestEventResponseDto, entities, {
      enableImplicitConversion: true
    });
  }

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(AbstractTestEventResponseDto, entity);
  }

  async getByEventId(eventId: string) {
    const entity = await this.repository.findOne({ where: { eventId } });
    return plainToInstance(AbstractTestEventResponseDto, entity);
  }

  async getEntityByEventId(eventId: string) {
    const entity = await this.repository.findOne({ where: { eventId } });
    if (!entity) {
      throw new HttpException('Test event not found', HttpStatus.NOT_FOUND);
    }
    return entity;
  }

  async getBySlugAndEventId(projectSlug: string, eventId: string) {
    const entity = await this.repository.findOne({
      relations: {
        testEventDetails: true,
        testImage: true,
        project: true
      },
      where: { project: { projectSlug }, eventId }
    });

    return plainToInstance(AbstractTestEventResponseDto, entity);
  }

  async getBySlugAndEventIds(projectSlug: string, eventIds: string[]) {
    const entities = await this.repository.find({
      relations: {
        testEventDetails: true,
        testImage: true,
        project: true
      },
      where: { project: { projectSlug }, eventId: In(eventIds) }
    });

    return entities.map((entity) => {
      return plainToInstance(FullTestEventResponseDto, entity, {
        enableImplicitConversion: true,
        excludeExtraneousValues: true
      });
    });
  }

  async create(projectEntity: ProjectEntity, data: CreateTestEventDto) {
    try {
      const testEvent = new TestEventEntity();
      testEvent.eventId = data.eventId;
      testEvent.eventName = data.eventName;
      testEvent.testName = data.testName;
      testEvent.message = data.message;
      testEvent.project = projectEntity;
      testEvent.stopNavigation = data.stopNavigation ?? false;
      const entity = await this.repository.save(testEvent);
      return plainToInstance(AbstractTestEventResponseDto, entity);
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: number, data: UpdateTestEventDto) {
    const entity = await this.repository.update(id, data);
    return plainToInstance(AbstractTestEventResponseDto, entity);
  }

  // TODO: verify it works as expected
  async updateTestEvents(projectSlug: string, data: UpdateTestEventDto[]) {
    // First fetch existing events
    const events = await this.repository.find({
      relations: {
        project: true
      },
      where: { project: { projectSlug } }
    });

    const updatedEntities: TestEventEntity[] = [];

    for (const event of events) {
      const updatedEvent = data.find((e) => e.eventId === event.eventId);
      if (updatedEvent) {
        // Update only specific fields to avoid unintended changes
        event.stopNavigation = updatedEvent.stopNavigation;
        // Add other fields you want to update

        // Use update() for specific field updates
        await this.repository.update(event.id, {
          stopNavigation: updatedEvent.stopNavigation
          // Add other fields you want to update
        });

        updatedEntities.push(event);
      }
    }

    // Fetch the final state of updated entities
    const finalEntities = await this.repository.find({
      where: { id: In(updatedEntities.map((e) => e.id)) }
    });

    return finalEntities.map((entity) =>
      plainToInstance(AbstractTestEventResponseDto, entity)
    );
  }

  async delete(eventId: string) {
    const entity = await this.repository.delete(eventId);
    return plainToInstance(AbstractTestEventResponseDto, entity);
  }

  async deleteByProjectSlugAndEventId(projectSlug: string, eventId: string) {
    const entity = await this.repository.delete({
      project: { projectSlug },
      eventId
    });
    return plainToInstance(AbstractTestEventResponseDto, entity);
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
      return plainToInstance(AbstractTestEventResponseDto, entity);
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
    }
  }

  async deleteMany(eventIds: string[]) {
    const entity = await this.repository.delete(eventIds);
    return plainToInstance(AbstractTestEventResponseDto, entity);
  }
}
