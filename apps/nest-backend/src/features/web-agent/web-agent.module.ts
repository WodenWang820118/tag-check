import { Module } from '@nestjs/common';
import { ActionModule } from './action/action.module';
import { WebAgentService } from './web-agent.service';
import { WebAgentUtilsService } from './web-agent-utils.service';
import { PuppeteerUtilsModule } from './puppeteer-utils/puppeteer-utils.module';
@Module({
  imports: [ActionModule, PuppeteerUtilsModule],
  providers: [WebAgentService, WebAgentUtilsService],
  exports: [WebAgentService, ActionModule, PuppeteerUtilsModule]
})
export class WebAgentModule {}
