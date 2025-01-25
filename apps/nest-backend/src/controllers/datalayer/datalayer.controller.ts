/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ApiOperation, ApiParam, ApiQuery, ApiResponse } from '@nestjs/swagger';
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
  ValidationPipe
} from '@nestjs/common';
import { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { EventInspectionControllerService } from './event-inspection-controller.service';
import { ProjectAbstractReportService } from '../../project-agent/project-abstract-report/project-abstract-report.service';
import { Log } from '../../common/logging-interceptor/logging-interceptor.service';

@Controller('datalayer')
export class DataLayerController {
  private readonly logger = new Logger(DataLayerController.name);

  constructor(
    private projectAbstractReportService: ProjectAbstractReportService,
    private eventInspectionControllerService: EventInspectionControllerService
  ) {}

  @ApiOperation({
    summary: 'Inspects a single event dataLayer',
    description:
      'This endpoint inspects a single event and returns dataLayer object,\
      and the comparison result written to an xlsx file.'
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The event Id of the test associated with the event.'
  })
  @ApiQuery({
    name: 'headless',
    description: 'Specifies if the test runs in headless mode.'
  })
  @ApiQuery({
    name: 'measurementId',
    required: false,
    description: 'An optional identifier to measure or differentiate events.'
  })
  @ApiQuery({
    name: 'username',
    required: false,
    description:
      'Optional username for authentication purposes. If provided, password must also be provided.'
  })
  @ApiQuery({
    name: 'password',
    required: false,
    description: 'Optional password for authentication purposes.'
  })
  @ApiResponse({ status: 200, description: 'The inspected dataLayer results.' })
  @Post('/:projectSlug/:eventId')
  @Log()
  async inspectSingleEvent(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Query('headless') headless: string,
    @Query('username') username: string,
    @Query('password') password: string,
    @Query('measurementId') measurementId: string,
    @Query('captureRequest') captureRequest: string,
    @Body(ValidationPipe) eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    try {
      await this.eventInspectionControllerService.inspectSingleEvent(
        projectSlug,
        eventId,
        headless,
        measurementId,
        {
          username,
          password
        },
        captureRequest,
        eventInspectionPresetDto
      );

      const abstractReport =
        await this.projectAbstractReportService.getSingleAbstractTestResultJson(
          projectSlug,
          eventId
        );
      return [abstractReport];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(error);
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @ApiOperation({
    summary: 'Inspects a project dataLayer',
    description:
      'This endpoint inspects an entire project and returns dataLayer object,\
    and the comparison result written to an xlsx file. Please see the \
    inspectSingleEvent endpoint for more parameters details.'
  })
  @Get(':projectSlug')
  @Log()
  async inspectProject(
    @Param('projectSlug') projectSlug: string,
    @Query('headless') headless: string,
    @Query('measurementId') measurementId: string,
    @Query('username') username: string,
    @Query('password') password: string,
    @Query('captureRequest') captureRequest: string,
    @Query('concurrency') concurrency = 2
  ) {
    return await this.eventInspectionControllerService.inspectProject(
      projectSlug,
      headless,
      measurementId,
      {
        username,
        password
      },
      captureRequest,
      Number(concurrency)
    );
  }

  @ApiOperation({
    summary: 'Stops the current operation',
    description:
      'This endpoint stops the current operation and returns the results of the operation.'
  })
  @ApiResponse({ status: 200, description: 'Operation stopped successfully.' })
  @Post('stop-operation')
  @Log()
  async stopOperation() {
    try {
      await this.eventInspectionControllerService.stopOperation();
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
