import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateSpecDto,
  SpecEntity,
  SpecResponseDto,
  TestEventEntity,
  UpdateSpecDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';
import { StrictDataLayerEvent } from '@utils';
import { AbstractSpecResponseDto } from '../../../shared/dto/spec/datalayer-spec-response.dto';

@Injectable()
export class SpecRepositoryService {
  constructor(
    @InjectRepository(SpecEntity)
    private readonly repository: Repository<SpecEntity>,
    @InjectRepository(TestEventEntity)
    private readonly testEventRepository: Repository<TestEventEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(SpecResponseDto, entity);
  }

  async list(projectSlug: string) {
    try {
      const entities = await this.repository.find({
        relations: {
          testEvent: {
            project: true
          }
        },
        where: {
          testEvent: {
            project: {
              projectSlug: projectSlug
            }
          }
        }
      });

      Logger.log(`Found ${entities.length} entities`);

      // Check if entities exist before conversion
      if (!entities || entities.length === 0) {
        return [];
      }

      try {
        const result = plainToInstance(AbstractSpecResponseDto, entities);
        return result;
      } catch (conversionError) {
        Logger.error(
          `DTO conversion error: ${conversionError}`,
          conversionError
        );
        throw new HttpException(
          `Error converting specs: ${conversionError}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    } catch (error) {
      Logger.error(`Database query error: ${error}`, error);
      throw new HttpException(
        `Error getting project specs: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSpecByProjectSlugAndEventId(projectSlug: string, eventId: string) {
    try {
      const entity = await this.repository.findOne({
        relations: {
          testEvent: {
            project: true
          }
        },
        where: {
          testEvent: {
            project: {
              projectSlug: projectSlug
            },
            eventId: eventId
          }
        }
      });
      return plainToInstance(AbstractSpecResponseDto, entity);
    } catch (error) {
      Logger.error(error);
      throw new HttpException('Error getting spec', HttpStatus.BAD_REQUEST);
    }
  }

  async create(testEventEntity: TestEventEntity, spec: CreateSpecDto) {
    try {
      const specEntity = new SpecEntity();
      specEntity.testEvent = testEventEntity;
      specEntity.eventName = spec.event;
      specEntity.dataLayerSpec = spec.dataLayerSpec;
      const entity = await this.repository.save(specEntity);
      return plainToInstance(SpecResponseDto, entity);
    } catch (error) {
      Logger.error(error);
      throw new HttpException('Error creating spec', HttpStatus.BAD_REQUEST);
    }
  }

  async update(projectSlug: string, eventId: string, spec: UpdateSpecDto) {
    const testEvent = await this.testEventRepository.findOne({
      relations: { project: true },
      where: {
        eventId: eventId,
        project: { projectSlug: projectSlug }
      }
    });
    if (!testEvent)
      throw new HttpException('TestEvent not found', HttpStatus.NOT_FOUND);

    const newSpec = new SpecEntity();

    newSpec.eventName = spec.event ?? '';
    newSpec.dataLayerSpec = spec as StrictDataLayerEvent;
    const entity = await this.repository.update(
      { testEvent: testEvent },
      newSpec
    );
    Logger.log(JSON.stringify(entity), 'SpecRepositoryService.update');
    return plainToInstance(SpecResponseDto, entity);
  }
}
