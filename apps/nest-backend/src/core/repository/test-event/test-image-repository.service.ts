import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateTestImageDto,
  TestImageEntity,
  UpdateTestImageDto
} from '../../../shared';

@Injectable()
export class TestImageRepositoryService {
  constructor(
    @InjectRepository(TestImageEntity)
    private readonly repository: Repository<TestImageEntity>
  ) {}

  async get(id: number) {
    return this.repository.findOne({ where: { id } });
  }

  async getByProjectSlugAndEventId(projectSlug: string, eventId: string) {
    return this.repository.findOne({
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
  }

  async getByEventId(eventId: string) {
    return this.repository.findOne({
      relations: {
        testEvent: true
      },
      where: {
        testEvent: {
          eventId
        }
      }
    });
  }

  async create(data: CreateTestImageDto) {
    if (!data.imageData) {
      throw new Error('No data provided');
    }

    if (!data.imageName) {
      throw new Error('No name provided');
    }

    const blob = new Blob([data.imageData]);
    const buffer = Buffer.from(data.imageData);

    const imageResult = new TestImageEntity();
    imageResult.imageName = data.imageName;
    imageResult.imageData = buffer;
    imageResult.imageSize = blob.size; // Size in bytes

    return this.repository.save(imageResult);
  }

  async update(data: UpdateTestImageDto) {
    return this.repository.save(data);
  }
}
