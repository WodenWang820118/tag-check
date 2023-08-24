import { Module } from '@nestjs/common';
import { ActionModule } from './action/action.module';
import { AnalysisModule } from './analysis/analysis.module';
import { PuppeteerModule } from './puppeteer/puppeteer.module';
import { UtilitiesModule } from './utilities/utilities.module';
import { WebAgentService } from './web-agent.service';
import { WebAgentController } from './web-agent.controller';

@Module({
  imports: [ActionModule, AnalysisModule, PuppeteerModule, UtilitiesModule],
  exports: [WebAgentService],
  providers: [WebAgentService],
  controllers: [WebAgentController],
})
export class WebAgentModule {}
