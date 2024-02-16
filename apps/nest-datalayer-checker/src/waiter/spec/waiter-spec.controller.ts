import { Controller, Get, Param } from '@nestjs/common';
import { WaiterSpecService } from './waiter-spec.service';

@Controller('specs')
export class WaiterSpecController {
  constructor(private waiterSpecService: WaiterSpecService) {}

  @Get(':projectSlug')
  async getSpecs(@Param('projectSlug') projectSlug: string) {
    return await this.waiterSpecService.getSpecs(projectSlug);
  }

  @Get(':projectSlug/:eventName')
  async getSpec(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string
  ) {
    return await this.waiterSpecService.getSpec(projectSlug, eventName);
  }
}
