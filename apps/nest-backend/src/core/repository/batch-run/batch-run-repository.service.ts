import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type {
  BatchRunItemStatus,
  BatchRunSource,
  BatchRunStatus
} from '@utils';
import {
  BatchRunEntity,
  BatchRunItemEntity,
  ProjectEntity,
  TestEventEntity
} from '../../../shared';

/** What a new batch is, besides its project and tests. */
export interface CreateBatchRunOptions {
  source: BatchRunSource;
  headless: boolean;
  scheduleId: number | null;
}

/** The columns of a batch the queue changes. */
export type BatchRunPatch = Partial<
  Pick<BatchRunEntity, 'status' | 'startedAt' | 'finishedAt'>
>;

/** The columns of an item the queue changes. */
export type BatchRunItemPatch = Partial<
  Pick<
    BatchRunItemEntity,
    'status' | 'message' | 'startedAt' | 'finishedAt' | 'testEventDetailId'
  >
>;

/** Batches that have not ended. */
const OPEN_BATCH_STATUSES: BatchRunStatus[] = ['pending', 'running'];
/** Items that have not ended. */
const OPEN_ITEM_STATUSES: BatchRunItemStatus[] = ['pending', 'running'];

/**
 * Reads and writes batches (`BatchRunEntity`) and their items
 * (`BatchRunItemEntity`). A batch is read with its project and its items,
 * ordered by position, each with its test.
 */
@Injectable()
export class BatchRunRepositoryService {
  constructor(
    @InjectRepository(BatchRunEntity)
    private readonly batches: Repository<BatchRunEntity>,
    @InjectRepository(BatchRunItemEntity)
    private readonly items: Repository<BatchRunItemEntity>
  ) {}

  /**
   * Creates a pending batch with one pending item per test, in the given
   * order, in one transaction.
   */
  async create(
    project: ProjectEntity,
    testEvents: TestEventEntity[],
    options: CreateBatchRunOptions
  ): Promise<BatchRunEntity> {
    const id = await this.batches.manager.transaction(async (manager) => {
      const batch = await manager.save(
        manager.create(BatchRunEntity, {
          project,
          source: options.source,
          scheduleId: options.scheduleId,
          headless: options.headless,
          status: 'pending',
          startedAt: null,
          finishedAt: null
        })
      );
      await manager.save(
        testEvents.map((testEvent, position) =>
          manager.create(BatchRunItemEntity, {
            batchRun: batch,
            testEvent,
            position,
            status: 'pending',
            message: null,
            startedAt: null,
            finishedAt: null,
            testEventDetailId: null
          })
        )
      );
      return batch.id;
    });
    return await this.getById(id);
  }

  /**
   * The batch with its project and items.
   *
   * @throws HttpException 404 when there is no such batch.
   */
  async getById(id: number): Promise<BatchRunEntity> {
    const batch = await this.batches.findOne({
      relations: { project: true, items: { testEvent: true } },
      where: { id },
      order: { items: { position: 'ASC' } }
    });
    if (!batch) {
      throw new HttpException('Batch run not found', HttpStatus.NOT_FOUND);
    }
    return batch;
  }

  /**
   * The project's batch with its items.
   *
   * @throws HttpException 404 when the project has no such batch.
   */
  async getForProject(
    projectSlug: string,
    id: number
  ): Promise<BatchRunEntity> {
    const batch = await this.batches.findOne({
      relations: { project: true, items: { testEvent: true } },
      where: { id, project: { projectSlug } },
      order: { items: { position: 'ASC' } }
    });
    if (!batch) {
      throw new HttpException('Batch run not found', HttpStatus.NOT_FOUND);
    }
    return batch;
  }

  /** The project's latest `limit` batches with their items, newest first. */
  async listForProject(
    projectSlug: string,
    limit: number
  ): Promise<BatchRunEntity[]> {
    const ids = await this.batches.find({
      select: { id: true },
      where: { project: { projectSlug } },
      order: { id: 'DESC' },
      take: limit
    });
    if (ids.length === 0) return [];
    return await this.batches.find({
      relations: { project: true, items: { testEvent: true } },
      where: { id: In(ids.map((batch) => batch.id)) },
      order: { id: 'DESC', items: { position: 'ASC' } }
    });
  }

  /** The ids of the batches that have not ended, oldest first. */
  async listOpenIds(): Promise<number[]> {
    const batches = await this.batches.find({
      select: { id: true },
      where: { status: In(OPEN_BATCH_STATUSES) },
      order: { id: 'ASC' }
    });
    return batches.map((batch) => batch.id);
  }

  /** The batch's first pending item, with its test, or null. */
  async nextPendingItem(batchId: number): Promise<BatchRunItemEntity | null> {
    return await this.items.findOne({
      relations: { testEvent: true },
      where: { batchRun: { id: batchId }, status: 'pending' },
      order: { position: 'ASC' }
    });
  }

  /**
   * Updates the batch only while its status is one of `from`, so a batch
   * cancelled meanwhile stays cancelled.
   *
   * @returns Whether the batch was updated.
   */
  async updateBatchIf(
    id: number,
    from: BatchRunStatus[],
    patch: BatchRunPatch
  ): Promise<boolean> {
    const result = await this.batches.update({ id, status: In(from) }, patch);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Updates the item only while its status is one of `from`, so an item
   * cancelled meanwhile stays cancelled.
   *
   * @returns Whether the item was updated.
   */
  async updateItemIf(
    id: number,
    from: BatchRunItemStatus[],
    patch: BatchRunItemPatch
  ): Promise<boolean> {
    const result = await this.items.update({ id, status: In(from) }, patch);
    return (result.affected ?? 0) > 0;
  }

  /**
   * Ends the batch's pending and running items as cancelled.
   *
   * @returns How many items were cancelled.
   */
  async cancelOpenItems(
    batchId: number,
    message: string,
    finishedAt: Date
  ): Promise<number> {
    const result = await this.items.update(
      { batchRun: { id: batchId }, status: In(OPEN_ITEM_STATUSES) },
      { status: 'cancelled', message, finishedAt }
    );
    return result.affected ?? 0;
  }

  /**
   * Puts the items left running (by a backend that stopped mid-run) back in
   * the queue.
   *
   * @returns How many items were requeued.
   */
  async requeueRunningItems(): Promise<number> {
    const result = await this.items.update(
      { status: 'running' },
      { status: 'pending', startedAt: null }
    );
    return result.affected ?? 0;
  }
}
