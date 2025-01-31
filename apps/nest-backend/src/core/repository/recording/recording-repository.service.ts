import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecordingEntity,
  CreateRecordingDto,
  TestEventEntity
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class RecordingRepositoryService {
  constructor(
    @InjectRepository(RecordingEntity)
    private readonly repository: Repository<RecordingEntity>,
    @InjectRepository(TestEventEntity)
    private readonly testEventRepository: Repository<TestEventEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(RecordingEntity, entity);
  }

  async listByProject(projectSlug: string) {
    const entity = await this.repository.find({
      relations: {
        testEvent: {
          project: true
        }
      },
      where: {
        testEvent: {
          project: {
            projectSlug
          }
        }
      }
    });
    return plainToInstance(RecordingEntity, entity);
  }

  async getRecordingDetails(projectSlug: string, eventId: string) {
    const entity = await this.repository.findOne({
      relations: {
        testEvent: {
          project: true
        }
      },
      where: {
        testEvent: {
          eventId: eventId,
          project: {
            projectSlug: projectSlug
          }
        }
      }
    });
    return plainToInstance(RecordingEntity, entity);
  }

  async create(projectSlug: string, eventId: string, data: CreateRecordingDto) {
    const testEventEntity = await this.testEventRepository.findOne({
      relations: {
        project: true
      },
      where: {
        eventId: eventId,
        project: {
          projectSlug: projectSlug
        }
      }
    });

    if (!testEventEntity) {
      throw new HttpException('TestEvent not found', HttpStatus.NOT_FOUND);
    }

    const recordingEntity = new RecordingEntity();
    recordingEntity.title = data.title;
    recordingEntity.steps = data.steps;
    recordingEntity.testEvent = testEventEntity;

    const entity = await this.repository.save(recordingEntity);
    return plainToInstance(RecordingEntity, entity);
  }

  async update(projectSlug: string, eventId: string, data: CreateRecordingDto) {
    const recording = await this.getRecordingDetails(projectSlug, eventId);
    if (!recording) {
      throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(recording, data);
    const entity = await this.repository.save(recording);
    return plainToInstance(RecordingEntity, entity);
  }
}
