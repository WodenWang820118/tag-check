import { Injectable } from '@nestjs/common';
import { ImageResult } from '../entity/image_result.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm/repository/Repository';

@Injectable()
export class ImageResultService {
  constructor(
    @InjectRepository(ImageResult)
    private readonly imageResultRepository: Repository<ImageResult>
  ) {}

  async get(eventId: string) {
    return this.imageResultRepository.findOne({ where: { eventId } });
  }

  async create(data: {
    eventId: string;
    name: string;
    data: Uint8Array;
  }): Promise<ImageResult> {
    const blob = new Blob([data.data]);
    const buffer = Buffer.from(data.data);

    const imageResult = new ImageResult();
    imageResult.eventId = data.eventId;
    imageResult.name = data.name;
    imageResult.data = buffer;
    imageResult.size = blob.size; // Size in bytes

    return this.imageResultRepository.save(imageResult);
  }
}
