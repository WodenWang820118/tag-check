import { Controller, Get, Header, Query, StreamableFile } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WaiterGtmSpecParserService } from './waiter-gtm-spec-parser.service';

@Controller('waiter-spec-parser')
export class WaiterSpecParserController {
  constructor(private waiterGtmSpecParserService: WaiterGtmSpecParserService) {}

  @ApiOperation({
    summary: 'read a tagging plan from a specifc project',
    description:
      'This endpoint reads a tagging plan from a specifc project. \
      The tagging plan is a json file that contains a list of events and their parameters.',
  })
  @ApiQuery({
    name: 'projectName',
    description: 'The name of the project',
  })
  @ApiResponse({ status: 200, description: 'Generate GTM configuration' })
  @Get('/output-gtm-spec')
  @Header('Content-Type', 'application/json')
  @Header('Content-Disposition', 'attachment; filename=gtm-spec.json')
  async outputGTMSpec(
    @Query('projectName') projectName: string
  ): Promise<StreamableFile> {
    return await this.waiterGtmSpecParserService.outputGTMSpec(projectName);
  }
}
