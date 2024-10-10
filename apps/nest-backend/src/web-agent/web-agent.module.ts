import { Module } from '@nestjs/common';
import { ActionModule } from './action/action.module';
import { WebAgentService } from './web-agent.service';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { PuppeteerUtilsModule } from './puppeteer-utils/puppeteer-utils.module';
import { PuppeteerUtilsService } from './puppeteer-utils/puppeteer-utils.service';
@Module({
  imports: [ActionModule, PuppeteerUtilsModule],
  providers: [WebAgentService, WebAgentUtilsService, PuppeteerUtilsService],
  exports: [WebAgentService, ActionModule, PuppeteerUtilsModule],
})
export class WebAgentModule {}
