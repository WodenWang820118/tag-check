import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import type { BatchRunResponse, CreateBatchRunRequest } from '@utils';
import { BatchQueueService } from '../../features/batch-queue/batch-queue.service';

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Reads `{ eventIds: string[], headless?: boolean }`; throws 400 otherwise. */
function readCreateBody(body: unknown): Partial<CreateBatchRunRequest> & {
  eventIds: string[];
} {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    throw new BadRequestException('The body must be a JSON object');
  }
  const eventIds: unknown = Reflect.get(body, 'eventIds');
  const headless: unknown = Reflect.get(body, 'headless');
  if (
    !Array.isArray(eventIds) ||
    eventIds.length === 0 ||
    !eventIds.every((id) => typeof id === 'string' && id !== '')
  ) {
    throw new BadRequestException(
      'eventIds must be a non-empty list of test eventIds'
    );
  }
  if (headless !== undefined && typeof headless !== 'boolean') {
    throw new BadRequestException('headless must be true or false');
  }
  return {
    eventIds: eventIds.filter((id): id is string => typeof id === 'string'),
    headless
  };
}

/** Reads `?limit=`: 1 to 100, 20 when missing. */
function readLimit(limit: string | undefined): number {
  if (limit === undefined || limit === '') return DEFAULT_LIMIT;
  const value = Number(limit);
  if (!Number.isInteger(value) || value < 1 || value > MAX_LIMIT) {
    throw new BadRequestException(
      `limit must be a whole number from 1 to ${MAX_LIMIT}`
    );
  }
  return value;
}

/**
 * Batches of tests the backend runs one at a time, in the order they were
 * created, whether or not a window is open. Progress is sent as
 * `batchUpdate` events on GET /events.
 */
@Controller('batch-runs')
export class BatchRunsController {
  constructor(private readonly batchQueueService: BatchQueueService) {}

  @ApiOperation({
    summary: 'Enqueues a batch',
    description:
      'Body: { eventIds: string[], headless?: boolean }. The tests run in the given order; headless defaults to the project browser setting. 400 for an empty list or tests the project does not have.'
  })
  @ApiParam({ name: 'projectSlug' })
  @Post(':projectSlug')
  async create(
    @Param('projectSlug') projectSlug: string,
    @Body() body: unknown
  ): Promise<BatchRunResponse> {
    const { eventIds, headless } = readCreateBody(body);
    return await this.batchQueueService.enqueue(projectSlug, eventIds, {
      source: 'manual',
      headless
    });
  }

  @ApiOperation({ summary: "Lists the project's batches, newest first" })
  @ApiParam({ name: 'projectSlug' })
  @ApiQuery({ name: 'limit', required: false, description: '1 to 100; 20' })
  @Get(':projectSlug')
  async list(
    @Param('projectSlug') projectSlug: string,
    @Query('limit') limit?: string
  ): Promise<BatchRunResponse[]> {
    return await this.batchQueueService.list(projectSlug, readLimit(limit));
  }

  @ApiOperation({ summary: 'Reads one batch with its items' })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'batchId' })
  @Get(':projectSlug/:batchId')
  async get(
    @Param('projectSlug') projectSlug: string,
    @Param('batchId', ParseIntPipe) batchId: number
  ): Promise<BatchRunResponse> {
    return await this.batchQueueService.get(projectSlug, batchId);
  }

  @ApiOperation({
    summary: 'Cancels a batch',
    description:
      'Pending tests and the running one end cancelled; the running browser is closed. A batch that has ended is returned unchanged.'
  })
  @ApiParam({ name: 'projectSlug' })
  @ApiParam({ name: 'batchId' })
  @Post(':projectSlug/:batchId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('projectSlug') projectSlug: string,
    @Param('batchId', ParseIntPipe) batchId: number
  ): Promise<BatchRunResponse> {
    return await this.batchQueueService.cancel(projectSlug, batchId);
  }
}
