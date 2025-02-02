import { ProjectEntity } from './../../../shared/entity/project.entity';
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

  async getSpecByProjectSlugAndEventId(projectSlug: string, eventId: string) {
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

  async update(
    projectEntity: ProjectEntity,
    eventId: string,
    spec: UpdateSpecDto
  ) {
    const specEntity = await this.repository.findOne({
      relations: {
        testEvent: {
          project: true
        }
      },
      where: {
        testEvent: {
          eventId: eventId,
          project: {
            projectSlug: projectEntity.projectSlug
          }
        }
      }
    });

    Logger.log('SpecEntity', specEntity);

    if (!specEntity) {
      const testEvent = await this.testEventRepository.findOne({
        relations: {
          project: true
        },
        where: {
          project: {
            projectSlug: projectEntity.projectSlug
          },
          eventId: eventId
        }
      });
      if (!testEvent || !spec.event) {
        throw new HttpException('Spec not found', HttpStatus.NOT_FOUND);
      }
      Logger.log('TestEvent', testEvent);
      const newSpec = new SpecEntity();
      newSpec.testEvent = testEvent;
      newSpec.eventName = spec.event;
      newSpec.dataLayerSpec = spec as StrictDataLayerEvent;
      const entity = await this.repository.save(newSpec);
      return plainToInstance(SpecResponseDto, entity);
    }

    specEntity.dataLayerSpec = spec as StrictDataLayerEvent;
    const entity = await this.repository.save(specEntity);
    return plainToInstance(SpecResponseDto, entity);
  }
}
