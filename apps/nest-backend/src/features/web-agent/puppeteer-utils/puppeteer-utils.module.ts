import { Module } from '@nestjs/common';
import { PuppeteerUtilsService } from './puppeteer-utils.service';
import { FilePathService } from '../../../infrastructure/os/path/file-path/file-path.service';
import { OsModule } from '../../../infrastructure/os/os.module';
@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [PuppeteerUtilsService, FilePathService],
  exports: [PuppeteerUtilsService]
})
export class PuppeteerUtilsModule {}
