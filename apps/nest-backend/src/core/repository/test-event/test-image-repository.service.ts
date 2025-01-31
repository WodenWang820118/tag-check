import { TestEventEntity } from './../../../shared/entity/test-event.entity';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestImageDto,
  TestImageEntity,
  TestImageResponseDto,
  UpdateTestImageDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TestImageRepositoryService {
  constructor(
    @InjectRepository(TestImageEntity)
    private readonly repository: Repository<TestImageEntity>,
    @InjectRepository(TestEventEntity)
    private readonly testEventRepository: Repository<TestEventEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(TestImageResponseDto, entity);
  }

  async getByProjectSlugAndEventId(projectSlug: string, eventId: string) {
    const entity = await this.repository.findOne({
      relations: {
        testEvent: true
      },
      where: {
        testEvent: {
          eventId,
          project: {
            projectSlug
          }
        }
      }
    });
    return plainToInstance(TestImageResponseDto, entity);
  }

  async create(projectSlug: string, eventId: string, data: CreateTestImageDto) {
    const testEvent = await this.testEventRepository.findOne({
      relations: {
        project: true
      },
      where: {
        eventId,
        project: {
          projectSlug
        }
      }
    });

    if (!testEvent) {
      throw new HttpException('Test event not found', HttpStatus.NOT_FOUND);
    }

    if (!data.imageData) {
      throw new Error('No data provided');
    }

    if (!data.imageName) {
      throw new Error('No name provided');
    }

    const blob = new Blob([data.imageData]);
    const buffer = Buffer.from(data.imageData);

    const testImageEntity = new TestImageEntity();
    testImageEntity.imageName = data.imageName;
    testImageEntity.imageData = buffer;
    testImageEntity.imageSize = blob.size; // Size in bytes
    testImageEntity.testEvent = testEvent;

    const entity = this.repository.save(testImageEntity);
    return plainToInstance(TestImageResponseDto, entity);
  }

  async update(data: UpdateTestImageDto) {
    const entity = await this.repository.save(data);
    return plainToInstance(TestImageResponseDto, entity);
  }
}
