import { Injectable } from '@nestjs/common';
import { TestImageEntity } from '../../../shared/entity/test-image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CreateTestImageDto } from '../../../shared';
// TODO: replace the service with the another repository service
@Injectable()
export class TestImageService {
  constructor(
    @InjectRepository(TestImageEntity)
    private readonly repository: Repository<TestImageEntity>
  ) {}

  async get(eventId: string) {
    return this.repository.find();
  }

  async create(data: CreateTestImageDto): Promise<TestImageEntity> {
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
}
