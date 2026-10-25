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
import type { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';
import { EventInspectionControllerService } from './event-inspection-controller.service';
import { TestReportFacadeRepositoryService } from '../../features/repository/test-report-facade/test-report-facade-repository.service';
import { InspectEventQueryDto } from './dto/inspect-event-query.dto';

/**
 * Runs a test directly against the site (not through GTM Preview) and stops a
 * running test.
 */
@Controller('datalayer')
export class DataLayerController {
  private readonly logger = new Logger(DataLayerController.name);

  constructor(
    private readonly eventInspectionControllerService: EventInspectionControllerService,
    private readonly testReportFacadeRepositoryService: TestReportFacadeRepositoryService
  ) {}

  @ApiOperation({
    summary: 'Inspects a single event dataLayer',
    description: `This endpoint inspects a single event and returns dataLayer object,
      and the comparison result written to an xlsx file.`
  })
  @ApiParam({
    name: 'projectSlug',
    description: 'The name of the project to which the event belongs.'
  })
  @ApiParam({
    name: 'eventId',
    description: 'The event Id of the test associated with the event.'
  })
  @ApiResponse({ status: 200, description: 'The inspected dataLayer results.' })
  @Post(':projectSlug/:eventId')
  async inspectSingleEvent(
    @Param('projectSlug') projectSlug: string,
    @Param('eventId') eventId: string,
    @Query() query: InspectEventQueryDto,
    @Body() eventInspectionPresetDto: EventInspectionPresetDto
  ) {
    this.logger.log(
      `Inspecting single event: projectSlug=${projectSlug}, eventId=${eventId}, queryKeys=${Object.keys(query).join(',')}, presetKeys=${Object.keys(eventInspectionPresetDto).join(',')}`
    );
    try {
      await this.eventInspectionControllerService.inspectSingleEvent(
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
      return [abstractReport];
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error(error);
      throw new HttpException(
        error instanceof Error ? error.message : String(error),
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @ApiOperation({
    summary: 'Stops the current operation',
    description:
      'This endpoint stops the current operation and returns the results of the operation.'
  })
  @ApiResponse({ status: 200, description: 'Operation stopped successfully.' })
  @Post('stop-operation')
  async stopOperation() {
    try {
      await this.eventInspectionControllerService.stopOperation();
      return { status: 200, message: 'Operation stopped successfully' };
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Failed to stop operation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
