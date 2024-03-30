import {
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  StreamableFile,
} from '@nestjs/common';
import { readFileSync } from 'fs';
import { SpecParser } from '@tag-check/spec-parser';
import { FilePathService } from '../../os/path/file-path/file-path.service';

@Injectable()
export class WaiterGtmSpecParserService {
  specParser: SpecParser = new SpecParser();
  constructor(private filePathService: FilePathService) {}
  async outputGTMSpec(projectName: string) {
    try {
      const specsContent = readFileSync(
        await this.filePathService.getProjectConfigFilePath(projectName),
        'utf-8'
      );
      const buffer = Buffer.from(
        JSON.stringify(this.specParser.outputGTMSpec(specsContent), null, 2)
      );
      // Create a StreamableFile
      const stream = new StreamableFile(buffer);

      return stream;
    } catch (error) {
      Logger.error(error.message, 'WaiterService.outputGTMSpec');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
