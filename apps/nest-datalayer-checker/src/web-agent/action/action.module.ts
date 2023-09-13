import { Module } from '@nestjs/common';
import { ActionService } from './action.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { UtilitiesModule } from '../utilities/utilities.module';

@Module({
  imports: [PuppeteerModule, UtilitiesModule],
  controllers: [],
  providers: [ActionService],
  exports: [ActionService],
})
export class ActionModule {}
