import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query
} from '@nestjs/common';
import { EventInspectionPresetDto } from '@utils';
import { GtmOperatorService } from '../../infrastructure/gtm-operator/gtm-operator.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';
import { InspectGtmQueryDto } from './dto/inspect-gtm-query.dto';
import { TestReportFacadeRepositoryService } from '../../features/repository/test-report-facade/test-report-facade-repository.service';

@Controller('datalayer')
export class GtmOperatorController {
  private readonly logger = new Logger(GtmOperatorController.name);
  constructor(
    private readonly gtmOperatorService: GtmOperatorService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService
  ) {}

  @ApiOperation({
    summary: 'Inspects a single event dataLayer with GTM',
    description:
      'This endpoint inspects a single event and automates the process with GTM preview mode.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The event identifier.'
  })
  @ApiResponse({ status: 200, description: 'The inspected dataLayer results.' })
  @Post('/gtm-operator/:projectSlug/:eventId')
  async inspectSingleEventViaGtm(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Query() query: InspectGtmQueryDto,
    @Body() eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    await this.gtmOperatorService.inspectSingleEventViaGtm(
      projectSlug,
      eventId,
      query,
      eventInspectionPresetDto
    );

    const abstractReport =
      await this.testReportFacadeRepositoryService.getReportDetail(
        projectSlug,
        eventId
      );
    this.logger.log(
      JSON.stringify(abstractReport.testEventDetails, null, 2),
      'Abstract Report: '
    );
    return [abstractReport];
  }

  @Post('stop-gtm-operation')
  @ApiOperation({
    summary: 'Stops the current operation',
    description:
      'This endpoint stops the current operation and returns the results of the operation.'
  })
  @ApiResponse({ status: 200, description: 'Operation stopped successfully.' })
  @Log()
  stopOperation() {
    try {
      this.gtmOperatorService.stopOperation();
      return { message: 'Operation stopped successfully' };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Failed to stop operation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
