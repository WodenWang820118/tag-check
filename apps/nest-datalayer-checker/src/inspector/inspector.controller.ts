import { Controller, Get, Param, Query } from '@nestjs/common';
import { InspectorService } from './inspector.service';

@Controller('inspector')
export class InspectorController {
  constructor(private readonly inspectorService: InspectorService) {}

  // @Get('/inspect/:projectName/:testName')
  // async inspectDataLayer(
  //   @Param('projectName') projectName: string,
  //   @Param('testName') testName: string,
  //   @Query('headless') headless = 'false',
  //   @Query('path') path?: string
  // ) {
  //   return await this.inspectorService.inspectDataLayer(
  //     projectName,
  //     testName,
  //     headless,
  //     path
  //   );
  // }

  // @Get('/inspect/:projectName')
  // async inspectProjectDataLayer(
  //   @Param('projectName') projectName: string,
  //   @Query('headless') headless = 'true',
  //   @Query('path') path?: string
  // ) {
  //   return await this.inspectorService.inspectProjectDataLayer(
  //     projectName,
  //     headless,
  //     path
  //   );
  // }
}
