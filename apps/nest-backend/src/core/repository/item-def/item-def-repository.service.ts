import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateItemDefDto,
  ItemDefEntity,
  ItemDefResponseDto,
  TestEventEntity,
  UpdateItemDefDto
} from '../../../shared';
import { plainToInstance } from 'class-transformer';

/** Reads and writes tests' ecommerce item definitions (`ItemDefEntity`). */
@Injectable()
export class ItemDefRepositoryService {
  constructor(
    @InjectRepository(ItemDefEntity)
    private readonly repository: Repository<ItemDefEntity>
  ) {}

  async get(id: number) {
    const entity = await this.repository.findOne({ where: { id } });
    return plainToInstance(ItemDefResponseDto, entity);
  }

  /**
   * Returns the item definition of one test, or null when it has none. A
   * definition belongs to one test; its `itemId` (the event name, for the
   * example project) is shared by every project's test of that event.
   */
  async getItemDefByProjectSlugAndEventId(
    projectSlug: string,
    eventId: string
  ) {
    const entity = await this.repository.findOne({
      where: { testEvent: { eventId, project: { projectSlug } } }
    });
    return entity ? plainToInstance(ItemDefResponseDto, entity) : null;
  }

  async list() {
    const entities = await this.repository.find();
    return plainToInstance(ItemDefResponseDto, entities);
  }

  async create(testEventEntity: TestEventEntity, data: CreateItemDefDto) {
    const fullItemDefEntity = new ItemDefEntity();
    fullItemDefEntity.testEvent = testEventEntity;
    fullItemDefEntity.fullItemDef = data.fullItemDef;
    fullItemDefEntity.templateName = data.templateName;
    fullItemDefEntity.itemId = data.itemId;
    await this.repository.save(fullItemDefEntity);
    return plainToInstance(ItemDefResponseDto, fullItemDefEntity);
  }

  async update(id: number, data: UpdateItemDefDto) {
    await this.repository.update(id, data);
    const updatedEntity = await this.repository.findOne({ where: { id } });
    return plainToInstance(ItemDefResponseDto, updatedEntity);
  }

  /**
   * Saves the item definition of one test: updates the test's own row, or
   * creates it when the test has none. Definitions of other tests, in this
   * project or another, are left alone even when they share the `itemId`.
   * A new definition takes the test's event name as its `itemId` and its
   * `itemId` as its template name unless `data` gives them.
   *
   * @throws HttpException 404 when the project has no test with this eventId.
   */
  async saveItemDefByProjectSlugAndEventId(
    projectSlug: string,
    eventId: string,
    data: UpdateItemDefDto
  ) {
    return await this.repository.manager.transaction(async (manager) => {
      const testEvent = await manager.findOne(TestEventEntity, {
        where: { eventId, project: { projectSlug } }
      });
      if (!testEvent) {
        throw new HttpException('Test not found', HttpStatus.NOT_FOUND);
      }

      const itemDef =
        (await manager.findOne(ItemDefEntity, {
          where: { testEvent: { id: testEvent.id } }
        })) ?? manager.create(ItemDefEntity, { testEvent });
      itemDef.itemId = data.itemId ?? itemDef.itemId ?? testEvent.eventName;
      itemDef.templateName =
        data.templateName ?? itemDef.templateName ?? itemDef.itemId;
      if (data.fullItemDef !== undefined) {
        itemDef.fullItemDef = data.fullItemDef;
      }

      const saved = await manager.save(ItemDefEntity, itemDef);
      return plainToInstance(ItemDefResponseDto, saved);
    });
  }

  async delete(id: number) {
    await this.repository.delete(id);
  }
}
