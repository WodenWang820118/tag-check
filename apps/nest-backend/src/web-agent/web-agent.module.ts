import { Module } from '@nestjs/common';
import { ActionModule } from './action/action.module';
import { WebAgentService } from './web-agent.service';
import { WebAgentUtilsService } from './web-agent-utils.service';

@Module({
  imports: [ActionModule],
  providers: [WebAgentService, WebAgentUtilsService],
  exports: [WebAgentService, ActionModule],
})
export class WebAgentModule {}
