import { Injectable } from '@nestjs/common';
import { ImageResult } from '../entity/image-result.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';
import { CreateImageResultDto } from '../dto/image-result/create-image-result.dto';

@Injectable()
export class ImageResultService {
  constructor(
    @InjectRepository(ImageResult)
    private readonly imageResultRepository: Repository<ImageResult>
  ) {}

  async get(eventId: string) {
    return this.imageResultRepository.findOne({ where: { eventId } });
  }

  async create(data: Partial<CreateImageResultDto>): Promise<ImageResult> {
    if (!data.imageData) {
      throw new Error('No data provided');
    }

    if (!data.eventId) {
      throw new Error('No eventId provided');
    }

    if (!data.imageName) {
      throw new Error('No name provided');
    }

    const blob = new Blob([data.imageData]);
    const buffer = Buffer.from(data.imageData);

    const imageResult = new ImageResult();
    imageResult.eventId = data.eventId;
    imageResult.imageName = data.imageName;
    imageResult.imageData = buffer;
    imageResult.imageSize = blob.size; // Size in bytes

    return this.imageResultRepository.save(imageResult);
  }
}
