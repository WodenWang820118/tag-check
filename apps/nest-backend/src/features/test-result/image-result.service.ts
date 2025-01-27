import { Injectable } from '@nestjs/common';
import { TestImageEntity } from '../../shared/entity/test-image.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CreateImageResultDto } from '../../shared/dto/image-result/create-image-result.dto';

@Injectable()
export class ImageResultService {
  constructor(
    @InjectRepository(TestImageEntity)
    private readonly imageResultRepository: Repository<TestImageEntity>
  ) {}

  async get(eventId: string) {
    return this.imageResultRepository.find();
  }

  async create(data: CreateImageResultDto): Promise<TestImageEntity> {
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

    return this.imageResultRepository.save(imageResult);
  }
}
