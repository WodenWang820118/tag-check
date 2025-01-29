import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RecordingEntity, CreateRecordingDto } from '../../../shared';

@Injectable()
export class RecordingRepositoryService {
  constructor(
    @InjectRepository(RecordingEntity)
    private readonly repository: Repository<RecordingEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async listByProject(projectSlug: string) {
    return this.repository.find({
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
  }

  async getRecordingDetails(projectSlug: string, eventId: string) {
    return this.repository.findOne({
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
  }

  async getByTestEventId(testEventId: number) {
    return this.repository.findOne({
      where: { testEvent: { id: testEventId } },
      relations: ['testEvent']
    });
  }

  async create(data: CreateRecordingDto) {
    const recording = this.repository.create(data);
    return this.repository.save(recording);
  }

  async update(projectSlug: string, eventId: string, data: CreateRecordingDto) {
    const recording = await this.getRecordingDetails(projectSlug, eventId);
    if (!recording) {
      throw new HttpException('Recording not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(recording, data);
    return this.repository.save(recording);
  }
}
