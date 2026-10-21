import { Module } from '@nestjs/common';
import { PuppeteerUtilsService } from './puppeteer-utils.service';
import { OsModule } from '../../../infrastructure/os/os.module';
@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [PuppeteerUtilsService],
  exports: [PuppeteerUtilsService]
})
export class PuppeteerUtilsModule {}
