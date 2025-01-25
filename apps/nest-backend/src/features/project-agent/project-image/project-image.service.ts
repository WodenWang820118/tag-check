import { Injectable } from '@nestjs/common';
import { ImageService } from '../../../infrastructure/os/image/image.service';

@Injectable()
export class ProjectImageService {
  constructor(private readonly imageService: ImageService) {}

  async readImage(eventId: string) {
    return await this.imageService.readImage(eventId);
  }
}
