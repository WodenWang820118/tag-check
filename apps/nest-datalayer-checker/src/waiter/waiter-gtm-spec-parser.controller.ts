import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { WaiterService } from './waiter.service';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

@Controller('waiter-spec-parser')
export class WaiterSpecParserController {
  constructor(private waiterService: WaiterService) {}

  @ApiOperation({
    summary: 'read a tagging plan from a specifc project',
    description:
      'This endpoint reads a tagging plan from a specifc project. \
      The tagging plan is a json file that contains a list of events and their parameters.',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The absolute path to the tagging plan.',
  })
  @ApiResponse({ status: 200, description: 'Generate GTM configuration' })
  @Get('/output-gtm-spec')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename=gtm-spec.json')
  outputGTMSpec(@Query('projectName') projectName: string): StreamableFile {
    return this.waiterService.outputGTMSpec(projectName);
  }
}
