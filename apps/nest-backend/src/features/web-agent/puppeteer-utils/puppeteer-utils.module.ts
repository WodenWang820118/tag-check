import { Module } from '@nestjs/common';
import { PuppeteerUtilsService } from './puppeteer-utils.service';
import { OsModule } from '../../../infrastructure/os/os.module';
/** Provides the browser launch, clean-up and screen recording of a run. */
@Module({
  // Data access through OsModule, the features' data-access layer.
  imports: [OsModule],
  providers: [PuppeteerUtilsService],
  exports: [PuppeteerUtilsService]
})
export class PuppeteerUtilsModule {}
