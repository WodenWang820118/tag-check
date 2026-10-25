import {
  getCheckStatus,
  type BatchFinishedPayload,
  type BatchRunItemStatus,
  type BatchRunResponse,
  type BatchUpdatePayload,
  type ScheduleResponse
} from '@utils';
import type {
  BatchRunEntity,
  BatchRunItemEntity,
  ScheduleEntity
} from '../../shared';
import { toClientErrorMessage } from '../../shared/client-error-message';

/** How a batch item ended, and why when it did not run to a result. */
export interface ItemOutcome {
  status: Extract<
    BatchRunItemStatus,
    'passed' | 'partial' | 'failed' | 'error'
  >;
  message: string | null;
  testEventDetailId: number | null;
}

/** The message of an item whose run threw nothing and saved nothing. */
export const NO_RESULT_MESSAGE = 'The run saved no result';

/**
 * An item's status from its run: the saved result's two checks, as
 * getCheckStatus reads them (both passed: passed; one: partial; neither:
 * failed), or `error` when the run threw, with the reason the client may see.
 * A run that threw keeps the result it saved, if any.
 */
export function toItemOutcome(
  result: { id: number; passed: boolean; requestPassed: boolean } | null,
  failure?: { error: unknown }
): ItemOutcome {
  if (failure) {
    return {
      status: 'error',
      message: toClientErrorMessage(failure.error) || 'The run failed',
      testEventDetailId: result?.id ?? null
    };
  }
  if (!result) {
    return {
      status: 'error',
      message: NO_RESULT_MESSAGE,
      testEventDetailId: null
    };
  }
  return {
    status: getCheckStatus(result.passed, result.requestPassed),
    message: null,
    testEventDetailId: result.id
  };
}

function itemResponse(item: BatchRunItemEntity) {
  return {
    id: item.id,
    eventId: item.testEvent.eventId,
    testName: item.testEvent.testName,
    eventName: item.testEvent.eventName,
    position: item.position,
    status: item.status,
    message: item.message,
    startedAt: item.startedAt,
    finishedAt: item.finishedAt,
    testEventDetailId: item.testEventDetailId
  };
}

/** A batch loaded with its project and items (each with its test). */
export function toBatchRunResponse(batch: BatchRunEntity): BatchRunResponse {
  return {
    id: batch.id,
    projectSlug: batch.project.projectSlug,
    source: batch.source,
    scheduleId: batch.scheduleId,
    headless: batch.headless,
    status: batch.status,
    createdAt: batch.createdAt,
    startedAt: batch.startedAt,
    finishedAt: batch.finishedAt,
    items: [...batch.items]
      .sort((a, b) => a.position - b.position)
      .map(itemResponse)
  };
}

/** The `batchUpdate` event of a batch loaded with its project and items. */
export function toBatchUpdatePayload(
  batch: BatchRunEntity
): BatchUpdatePayload {
  const response = toBatchRunResponse(batch);
  return {
    batchId: response.id,
    projectSlug: response.projectSlug,
    status: response.status,
    items: response.items.map((item) => ({
      eventId: item.eventId,
      status: item.status,
      message: item.message
    }))
  };
}

/**
 * The `batchFinished` event of a batch that ended, loaded with its project
 * and items: how many of its tests ended with each status. A cancelled
 * batch's open items are all cancelled; anything else left open counts as
 * cancelled too, so the counts add up to the total.
 */
export function toBatchFinishedPayload(
  batch: BatchRunEntity
): BatchFinishedPayload {
  const counts = { passed: 0, partial: 0, failed: 0, error: 0, cancelled: 0 };
  for (const item of batch.items) {
    switch (item.status) {
      case 'passed':
      case 'partial':
      case 'failed':
      case 'error':
        counts[item.status]++;
        break;
      default:
        counts.cancelled++;
    }
  }
  return {
    batchId: batch.id,
    projectSlug: batch.project.projectSlug,
    source: batch.source,
    status: batch.status === 'cancelled' ? 'cancelled' : 'completed',
    total: batch.items.length,
    ...counts
  };
}

/** A schedule loaded with its project. */
export function toScheduleResponse(schedule: ScheduleEntity): ScheduleResponse {
  return {
    id: schedule.id,
    projectSlug: schedule.project.projectSlug,
    name: schedule.name,
    eventIds: schedule.eventIds,
    kind: schedule.kind,
    time: schedule.time,
    weekdays: schedule.weekdays,
    everyHours: schedule.everyHours,
    enabled: schedule.enabled,
    lastRunAt: schedule.lastRunAt,
    nextRunAt: schedule.nextRunAt,
    createdAt: schedule.createdAt,
    // UpdateDateColumn is always set once the row is saved.
    updatedAt: schedule.updatedAt ?? schedule.createdAt
  };
}
