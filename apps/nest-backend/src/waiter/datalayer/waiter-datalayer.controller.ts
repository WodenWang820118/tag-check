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
  ValidationPipe,
} from '@nestjs/common';
import { EventInspectionPresetDto } from '../../dto/event-inspection-preset.dto';
import { ValidationResult } from '@utils';
import { WaiterEventInspectionService } from './waiter-event-inspection.service';
import { ProjectAbstractReportService } from '../../project-agent/project-abstract-report/project-abstract-report.service';

@Controller('datalayer')
export class WaiterDataLayerController {
  constructor(
    private projectAbstractReportService: ProjectAbstractReportService,
    private waiterEventInspectionService: WaiterEventInspectionService
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
    name: 'eventId',
    description: 'The event Id of the test associated with the event.',
  })
  @ApiQuery({
    name: 'headless',
    description: 'Specifies if the test runs in headless mode.',
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
  @Post('/:projectSlug/:eventId')
  async inspectSingleEvent(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Query('headless') headless: string,
    @Query('username') username: string,
    @Query('password') password: string,
    @Query('measurementId') measurementId: string,
    @Body(ValidationPipe) eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    try {
      const results: {
        dataLayerResult: ValidationResult;
        rawRequest: string;
        requestCheckResult: ValidationResult;
        destinationUrl: string;
      }[] = await this.waiterEventInspectionService.inspectSingleEvent(
        projectSlug,
        eventId,
        headless,
        measurementId,
        {
          username,
          password,
        },
        eventInspectionPresetDto
      );
      Logger.log(
        results,
        `${WaiterDataLayerController.name}.${WaiterDataLayerController.prototype.inspectSingleEvent.name}`
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

      Logger.error(
        error,
        `${WaiterDataLayerController.name}.${WaiterDataLayerController.prototype.inspectSingleEvent.name}`
      );
      throw new HttpException(String(error), HttpStatus.INTERNAL_SERVER_ERROR);
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
    @Query('username') username: string,
    @Query('password') password: string,
    @Query('concurrency') concurrency = 2
  ) {
    return await this.waiterEventInspectionService.inspectProject(
      projectSlug,
      headless,
      measurementId,
      {
        username,
        password,
      },
      Number(concurrency)
    );
  }

  @Post('stop-operation')
  @ApiOperation({
    summary: 'Stops the current operation',
    description:
      'This endpoint stops the current operation and returns the results of the operation.',
  })
  @ApiResponse({ status: 200, description: 'Operation stopped successfully.' })
  async stopOperation() {
    try {
      await this.waiterEventInspectionService.stopOperation();
      return { message: 'Operation stopped successfully' };
    } catch (error) {
      Logger.error(
        error,
        `${WaiterDataLayerController.name}.${WaiterDataLayerController.prototype.stopOperation.name}`
      );
      throw new HttpException(
        'Failed to stop operation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
