import { Injectable } from '@nestjs/common';
import { ImageService } from '../../../infrastructure/os/image/image.service';

@Injectable()
export class ProjectImageService {
  constructor(private readonly imageService: ImageService) {}

  async readImage(projectSlug: string, eventId: string) {
    return await this.imageService.readImage(projectSlug, eventId);
  }
}
