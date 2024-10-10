import { Injectable } from '@nestjs/common';
import { ImageService } from '../../os/image/image.service';

@Injectable()
export class ProjectImageService {
  constructor(private readonly imageService: ImageService) {}

  async readImage(projectName: string, eventId: string) {
    return await this.imageService.readImage(projectName, eventId);
  }
}
