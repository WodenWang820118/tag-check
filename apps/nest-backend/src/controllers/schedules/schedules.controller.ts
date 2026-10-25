import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put
} from '@nestjs/common';
import { ApiOperation, ApiParam } from '@nestjs/swagger';
import type { BatchRunResponse, ScheduleResponse } from '@utils';
import { ScheduleService } from '../../features/batch-queue/schedule.service';

/**
 * A project's schedules: presets (daily, weekly, every N hours) that start a
 * headless batch of chosen tests while the backend runs.
 */
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @ApiOperation({ summary: "Lists the project's schedules" })
  @ApiParam({ name: 'projectSlug' })
  @Get(':projectSlug')
  async list(
    @Param('projectSlug') projectSlug: string
  ): Promise<ScheduleResponse[]> {
    return await this.scheduleService.list(projectSlug);
  }

  @ApiOperation({
    summary: 'Creates a schedule',
    description:
      'Body: { name, eventIds, kind: daily | weekly | everyHours, time: "HH:MM" (daily, weekly), weekdays: 0-6 (weekly), everyHours: 1-24 (everyHours), enabled? }. 400 with the reason for an invalid body.'
  })
  @ApiParam({ name: 'projectSlug' })
  @Post(':projectSlug')
  async create(
    @Param('projectSlug') projectSlug: string,
    @Body() body: unknown
  ): Promise<ScheduleResponse> {
    return await this.scheduleService.create(projectSlug, body);
  }

  @ApiOperation({
    summary: 'Updates a schedule',
    description: 'Fields left out keep their value.'
  })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'scheduleId' })
  @Put(':projectSlug/:scheduleId')
  async update(
    @Param('projectSlug') projectSlug: string,
    @Param('scheduleId', ParseIntPipe) scheduleId: number,
    @Body() body: unknown
  ): Promise<ScheduleResponse> {
    return await this.scheduleService.update(projectSlug, scheduleId, body);
  }

  @ApiOperation({
    summary: 'Deletes a schedule',
    description: 'Its past batches stay, without their schedule.'
  })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'scheduleId' })
  @Delete(':projectSlug/:scheduleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Param('projectSlug') projectSlug: string,
    @Param('scheduleId', ParseIntPipe) scheduleId: number
  ): Promise<void> {
    await this.scheduleService.delete(projectSlug, scheduleId);
  }

  @ApiOperation({
    summary: 'Runs a schedule now',
    description:
      'Enqueues its headless batch and answers 201 with it; the next scheduled run is unchanged.'
  })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'scheduleId' })
  @Post(':projectSlug/:scheduleId/run-now')
  async runNow(
    @Param('projectSlug') projectSlug: string,
    @Param('scheduleId', ParseIntPipe) scheduleId: number
  ): Promise<BatchRunResponse> {
    return await this.scheduleService.runNow(projectSlug, scheduleId);
  }
}
