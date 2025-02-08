import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RecordingEntity,
  CreateRecordingDto,
  TestEventEntity,
  RecordingResponseDto
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
    return plainToInstance(RecordingResponseDto, entity);
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
    return plainToInstance(RecordingResponseDto, entity);
  }

  async create(testEventEntity: TestEventEntity, data: CreateRecordingDto) {
    try {
      const recordingEntity = new RecordingEntity();
      recordingEntity.title = data.title;
      recordingEntity.steps = data.steps;
      recordingEntity.testEvent = testEventEntity;

      const entity = await this.repository.save(recordingEntity);
      return plainToInstance(RecordingResponseDto, entity);
    } catch (error) {
      throw new HttpException(String(error), HttpStatus.BAD_REQUEST);
    }
  }

  async update(projectSlug: string, eventId: string, data: CreateRecordingDto) {
    const testEvent = await this.testEventRepository.findOne({
      relations: { project: true },
      where: {
        eventId: eventId,
        project: { projectSlug: projectSlug }
      }
    });
    if (!testEvent)
      throw new HttpException('TestEvent not found', HttpStatus.NOT_FOUND);

    const newRecording = new RecordingEntity();
    newRecording.title = data.title;
    newRecording.steps = data.steps;
    newRecording.testEvent = testEvent;

    const entity = await this.repository.update(
      { testEvent: testEvent },
      newRecording
    );
    return plainToInstance(RecordingResponseDto, entity);
  }
}
