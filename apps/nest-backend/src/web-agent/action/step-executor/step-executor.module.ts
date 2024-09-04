import { Module } from '@nestjs/common';
import { StepExecutorUtilsService } from './step-executor-utils.service';
import { StepExecutorService } from './step-executor.service';
import { DataLayerModule } from '../web-monitoring/data-layer/data-layer.module';
import { DataLayerService } from '../web-monitoring/data-layer/data-layer.service';
import { HandlerModule } from '../handlers/handler.module';
import { ChangeHandler } from '../handlers/change-handler.service';
import { ClickHandler } from '../handlers/click-handler.service';
import { HoverHandler } from '../handlers/hover-handler.service';
import { ACTION_HANDLERS } from '../handlers/utils';
import { BrowserAction } from '../action-utils';

@Module({
  imports: [DataLayerModule, HandlerModule],
  providers: [
    StepExecutorService,
    StepExecutorUtilsService,
    DataLayerService,
    {
      provide: ACTION_HANDLERS,
      useFactory: (
        clickHandler: ClickHandler,
        changeHandler: ChangeHandler,
        hoverHandler: HoverHandler
      ) => {
        return {
          [BrowserAction.CLICK]: clickHandler,
          [BrowserAction.CHANGE]: changeHandler,
          [BrowserAction.HOVER]: hoverHandler,
        };
      },
      inject: [ClickHandler, ChangeHandler, HoverHandler],
    },
  ],
  exports: [StepExecutorService, StepExecutorUtilsService],
})
export class StepExecutorModule {}
