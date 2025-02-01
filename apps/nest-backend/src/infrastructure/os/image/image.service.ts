import {
  Injectable,
  NotFoundException,
  StreamableFile,
  Logger
} from '@nestjs/common';
import { extractEventNameFromId } from '@utils';
import { Readable } from 'stream';
import { TestImageRepositoryService } from '../../../core/repository/test-event/test-image-repository.service';

@Injectable()
export class ImageService {
  private logger = new Logger(ImageService.name);
  constructor(private testInageRepositoryService: TestImageRepositoryService) {}
  async readImage(projectSlug: string, eventId: string) {
    const image = await this.testInageRepositoryService.getBySlugAndEventId(
      projectSlug,
      eventId
    );

    if (!image) {
      throw new NotFoundException(`Image not found for event: ${eventId}`);
    }

    try {
      // Convert buffer to stream
      const stream = Readable.from(image.imageData);

      return new StreamableFile(stream, {
        type: 'image/png',
        disposition: `inline; filename="${extractEventNameFromId(eventId)}.png"`
      });
    } catch (error) {
      this.logger.error('Error streaming image:', error);
      throw error; // Re-throw the error to be handled by NestJS exception filters
    }
  }
}
