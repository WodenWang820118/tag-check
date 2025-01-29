import {
  Injectable,
  NotFoundException,
  StreamableFile,
  Logger
} from '@nestjs/common';
import { extractEventNameFromId } from '@utils';
import { Readable } from 'stream';
import { TestReportFacadeRepositoryService } from '../../../features/repository/test-report-facade/test-report-facade-repository.service';

@Injectable()
export class ImageService {
  private logger = new Logger(ImageService.name);
  constructor(
    private testReportFacadeRepositoryService: TestReportFacadeRepositoryService
  ) {}
  async readImage(eventId: string) {
    const image =
      await this.testReportFacadeRepositoryService.getTestImage(eventId);

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
