import { Injectable, Logger, StreamableFile } from '@nestjs/common';
import { FileService } from '../shared/file/file.service';
import { readFileSync } from 'fs';
import { SpecParser } from '@datalayer-checker/spec-parser';

@Injectable()
export class WaiterGtmSpecParserService {
  specParser: SpecParser = new SpecParser();
  constructor(private fileService: FileService) {}
  async outputGTMSpec(projectName: string) {
    try {
      const specsContent = readFileSync(
        await this.fileService.getSpecsPath(projectName),
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
    }
  }
}
