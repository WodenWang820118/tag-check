import { Module } from '@nestjs/common';
import { PuppeteerUtilsService } from './puppeteer-utils.service';

@Module({
  imports: [],
  providers: [PuppeteerUtilsService],
  exports: [PuppeteerUtilsService],
})
export class PuppeteerUtilsModule {}
