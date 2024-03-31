import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { WaiterDataLayerGroupEventsService } from './waiter-datalayer-group-events.service';
import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { WaiterDataLayerSingleEventService } from './waiter-datalayer-single-event.service';
import { InspectEventDto } from '../../dto/inspect-event.dto';
import { ValidationResult } from '../../interfaces/dataLayer.interface';
import { AbstractDatalayerReportService } from '../../os/abstract-datalayer-report/abstract-datalayer-report.service';

@Controller('datalayer')
export class WaiterDataLayerController {
  constructor(
    private waiterDataLayerGroupEventsService: WaiterDataLayerGroupEventsService,
    private waiterDataLayerSingleEventService: WaiterDataLayerSingleEventService,
    private abstractDatalayerReportService: AbstractDatalayerReportService
  ) {}

  @ApiOperation({
    summary: 'Inspects a single event dataLayer',
    description:
      'This endpoint inspects a single event and returns dataLayer object,\
      and the comparison result written to an xlsx file.',
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.',
  })
  @ApiParam({
    name: 'eventName',
    description: 'The name of the test associated with the event.',
  })
  @ApiQuery({
    name: 'headless',
    description: 'Specifies if the test runs in headless mode.',
  })
  @ApiQuery({
    name: 'path',
    required: false,
    description: 'The optional path where the event data is stored.',
  })
  @ApiQuery({
    name: 'measurementId',
    required: false,
    description: 'An optional identifier to measure or differentiate events.',
  })
  @ApiQuery({
    name: 'username',
    required: false,
    description:
      'Optional username for authentication purposes. If provided, password must also be provided.',
  })
  @ApiQuery({
    name: 'password',
    required: false,
    description: 'Optional password for authentication purposes.',
  })
  @ApiResponse({ status: 200, description: 'The inspected dataLayer results.' })
  @Post('/:projectSlug/:eventName')
  async inspectSingleEvent(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string,
    @Query('headless') headless: string,
    @Query('measurementId') measurementId?: string,
    @Query('path') path?: string,
    @Query('username') username?: string,
    @Query('password') password?: string,
    @Body(ValidationPipe) inspectEventDto?: InspectEventDto
  ) {
    // if no measurementId is provided, no need to grab requests
    try {
      const inspectionEventSettings = inspectEventDto;
      const results: {
        dataLayerResult: ValidationResult;
        rawRequest: string;
        requestCheckResult: ValidationResult;
        destinationUrl: string;
      }[] = await this.waiterDataLayerSingleEventService.inspectSingleEvent(
        projectSlug,
        eventName,
        headless,
        path,
        measurementId,
        {
          username,
          password,
        },
        inspectionEventSettings
      );
      Logger.log(results, 'waiter.inspectSingleEvent');

      const abstractReport =
        await this.abstractDatalayerReportService.getSingleAbstractTestResultJson(
          projectSlug,
          eventName
        );
      return [abstractReport];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      Logger.error(error, 'waiter.inspectSingleEvent');
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get(':projectSlug')
  @ApiOperation({
    summary: 'Inspects a project dataLayer',
    description:
      'This endpoint inspects an entire project and returns dataLayer object,\
      and the comparison result written to an xlsx file. Please see the \
      inspectSingleEvent endpoint for more parameters details.',
  })
  async inspectProject(
    @Param('projectSlug') projectSlug: string,
    @Query('headless') headless: string,
    @Query('measurementId') measurementId: string,
    @Query('path') path?: string,
    @Query('args') args?: string[],
    @Query('username') username?: string,
    @Query('password') password?: string,
    @Query('concurrency') concurrency = 2
  ) {
    return await this.waiterDataLayerGroupEventsService.inspectProject(
      projectSlug,
      headless,
      path,
      args,
      measurementId,
      {
        username,
        password,
      },
      Number(concurrency)
    );
  }
}
