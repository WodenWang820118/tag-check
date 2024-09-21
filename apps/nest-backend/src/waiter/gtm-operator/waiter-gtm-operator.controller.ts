/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ValidationResult, EventInspectionPresetDto } from '@utils';
import { GtmOperatorService } from '../../gtm-operator/gtm-operator.service';
import { ProjectAbstractReportService } from '../../project-agent/project-abstract-report/project-abstract-report.service';
import { Log } from '../../logging-interceptor/logging-interceptor.service';

@Controller('datalayer')
export class WaiterGtmOperatorController {
  constructor(
    private gtmOperatorService: GtmOperatorService,
    private projectAbstractReportService: ProjectAbstractReportService
  ) {}

  @ApiOperation({
    summary: 'Inspects a single event dataLayer with GTM',
    description:
      'This endpoint inspects a single event and automates the process with GTM preview mode.',
  })
  @ApiQuery({
    name: 'gtmUrl',
    description: 'The URL of the GTM preview mode share link.',
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
  @Post('/gtm-operator/:projectSlug/:eventName')
  @Log()
  async inspectSingleEventViaGtm(
    @Param('projectSlug') projectSlug: string,
    @Param('eventName') eventName: string,
    @Query('gtmUrl') gtmUrl: string,
    @Query('headless') headless: string,
    @Query('username') username: string,
    @Query('password') password: string,
    @Query('measurementId') measurementId: string,
    @Query('captureRequest') captureRequest: string,
    @Body() eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    const results: {
      dataLayerResult: ValidationResult;
      rawRequest: string;
      requestCheckResult: ValidationResult;
      destinationUrl: string;
    }[] = await this.gtmOperatorService.inspectSingleEventViaGtm(
      gtmUrl,
      projectSlug,
      eventName,
      'false',
      measurementId,
      {
        username,
        password,
      },
      captureRequest,
      eventInspectionPresetDto
    );

    const abstractReport =
      await this.projectAbstractReportService.getSingleAbstractTestResultJson(
        projectSlug,
        eventName
      );
    return [abstractReport];
  }

  @Post('stop-gtm-operation')
  @ApiOperation({
    summary: 'Stops the current operation',
    description:
      'This endpoint stops the current operation and returns the results of the operation.',
  })
  @ApiResponse({ status: 200, description: 'Operation stopped successfully.' })
  @Log()
  async stopOperation() {
    try {
      await this.gtmOperatorService.stopOperation();
      return { message: 'Operation stopped successfully' };
    } catch (error) {
      Logger.error(error, 'waiter.stopOperation');
      throw new HttpException(
        'Failed to stop operation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
