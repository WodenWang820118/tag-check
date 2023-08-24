import { Module } from '@nestjs/common';
import { ActionController } from './action.controller';
import { ActionService } from './action.service';
import { PuppeteerModule } from '../puppeteer/puppeteer.module';
import { UtilitiesModule } from '../utilities/utilities.module';

@Module({
  imports: [PuppeteerModule, UtilitiesModule],
  controllers: [ActionController],
  providers: [ActionService],
  exports: [ActionService],
})
export class ActionModule {}
