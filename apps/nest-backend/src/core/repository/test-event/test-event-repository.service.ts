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
  private readonly logger = new Logger(TestEventRepositoryService.name);
  constructor(
    @InjectRepository(TestEventEntity)
    private readonly repository: Repository<TestEventEntity>
  ) {}

  async listReports(
    projectSlug: string
  ): Promise<AbstractTestEventResponseDto[]> {
    const entities = await this.repository.find({
      relations: {
        testEventDetails: true,
        testImage: false,
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

  async listFileReports(projectSlug: string) {
    const query = this.repository
      .createQueryBuilder('test_event')
      .leftJoinAndSelect('test_event.project', 'project')
      .leftJoinAndSelect('test_event.testEventDetails', 'test_event_detail')
      .leftJoinAndSelect('test_event.recording', 'recording')
      .leftJoinAndSelect('test_event.spec', 'spec')
      .leftJoinAndSelect('test_event.testImage', 'test_image');

    return await query
      .where('project.projectSlug = :projectSlug', { projectSlug })
      .getMany();
  }

  async getEntityByEventId(eventId: string) {
    const entity = await this.repository.findOne({ where: { eventId } });
    if (!entity) {
      throw new HttpException('Test event not found', HttpStatus.NOT_FOUND);
    }
    return entity;
  }

  async getEntityBySlugAndEventId(projectSlug: string, eventId: string) {
    const entity = await this.repository.findOne({
      relations: {
        testEventDetails: true,
        testImage: true,
        project: true
      },
      where: { project: { projectSlug }, eventId }
    });

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
        project: true,
        spec: true,
        recording: true
      },
      where: { project: { projectSlug }, eventId: In(eventIds) }
    });

    return entities.map((entity) => {
      return plainToInstance(FullTestEventResponseDto, entity, {
        enableImplicitConversion: true,
        excludeExtraneousValues: false // true value will lead to missing fields such as dataLayerSpec
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

  async updateTestEvent(id: number, data: UpdateTestEventDto) {
    try {
      const entity = await this.repository.update(id, data);
      return plainToInstance(AbstractTestEventResponseDto, entity);
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
    }
  }

  // TODO: verify it works as expected
  // TODO: according to the star schema, this method should be refactored
  async updateTestEvents(projectSlug: string, data: UpdateTestEventDto[]) {
    // First fetch existing events with necessary relations
    const events = await this.repository.find({
      relations: {
        project: true,
        latestTestEventDetail: true,
        latestTestImage: true
      },
      where: {
        project: { projectSlug }
      }
    });

    const updatedEntities: TestEventEntity[] = [];

    for (const event of events) {
      const updatedEvent = data.find((e) => e.eventId === event.eventId);
      if (updatedEvent) {
        // Create update object with only the fields that can be updated
        const updateData: Partial<TestEventEntity> = {
          message: updatedEvent.message
        };

        // If latest records are provided in the DTO, update their references
        if (updatedEvent.latestTestEventDetailId) {
          updateData.latestTestEventDetailId =
            updatedEvent.latestTestEventDetailId;
        }

        if (updatedEvent.latestTestImageId) {
          updateData.latestTestImageId = updatedEvent.latestTestImageId;
        }

        // Use save instead of update to properly handle relations
        // Upsert
        const updatedEntity = await this.repository.save({
          ...event,
          ...updateData
        });

        updatedEntities.push(updatedEntity);
      }
    }

    // Fetch final state with all necessary relations
    const finalEntities = await this.repository.find({
      where: {
        id: In(updatedEntities.map((e) => e.id))
      },
      relations: {
        project: true,
        latestTestEventDetail: true,
        latestTestImage: true
      }
    });

    return finalEntities.map((entity) =>
      plainToInstance(AbstractTestEventResponseDto, entity)
    );
  }

  async update(id: number, data: UpdateTestEventDto) {
    const updatedEntity = await this.repository.update(id, {
      ...data
    });
    return plainToInstance(AbstractTestEventResponseDto, updatedEntity);
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
}
