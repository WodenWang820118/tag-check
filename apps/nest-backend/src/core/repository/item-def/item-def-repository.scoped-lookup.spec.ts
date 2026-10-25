import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ItemDefEntity,
  ProjectEntity,
  RecordingEntity,
  SpecEntity,
  TestEventDetailEntity,
  TestEventEntity,
  TestImageEntity
} from '../../../shared';
import { ItemDefRepositoryService } from './item-def-repository.service';

const entities = [
  ProjectEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  RecordingEntity,
  SpecEntity,
  TestEventEntity,
  ItemDefEntity,
  TestEventDetailEntity,
  TestImageEntity
];

describe('ItemDefRepositoryService.getItemDefByProjectSlugAndEventId (SQLite)', () => {
  let module: TestingModule;
  let service: ItemDefRepositoryService;
  let dataSource: DataSource;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities,
          synchronize: true,
          dropSchema: true,
          logging: false
        }),
        TypeOrmModule.forFeature(entities)
      ],
      providers: [ItemDefRepositoryService]
    }).compile();
    service = module.get(ItemDefRepositoryService);
    dataSource = module.get(DataSource);
  });

  afterEach(async () => {
    await module?.close();
  });

  async function addToCartTest(projectSlug: string, eventId: string) {
    const project =
      (await dataSource.manager.findOne(ProjectEntity, {
        where: { projectSlug }
      })) ??
      (await dataSource.manager.save(ProjectEntity, {
        projectSlug,
        projectName: projectSlug
      }));
    return await dataSource.manager.save(TestEventEntity, {
      project,
      eventId,
      eventName: 'add_to_cart',
      testName: eventId,
      message: 'This is a standard test'
    });
  }

  async function defineItem(testEvent: TestEventEntity, itemId: string) {
    return await service.create(testEvent, {
      itemId,
      templateName: `${itemId} items`,
      fullItemDef: { item_id: itemId }
    });
  }

  it("returns the test's own definition, not another project's of the same event", async () => {
    // The example project names its definitions after the event.
    const example = await addToCartTest('ng_gtm_integration_sample', 'atc');
    await defineItem(example, 'add_to_cart');
    await addToCartTest('my_shop', 'atc');
    const copy = await addToCartTest('my_shop_copy', 'atc');
    await defineItem(copy, 'add_to_cart');

    await expect(
      service.getItemDefByProjectSlugAndEventId('my_shop', 'atc')
    ).resolves.toBeNull();
    await expect(
      service.getItemDefByProjectSlugAndEventId('my_shop_copy', 'atc')
    ).resolves.toMatchObject({ itemId: 'add_to_cart' });
  });

  it('tells apart two tests of the same event in one project', async () => {
    const first = await addToCartTest('my_shop', 'atc_1');
    await defineItem(first, 'sku_1');
    const second = await addToCartTest('my_shop', 'atc_2');
    await defineItem(second, 'sku_2');

    await expect(
      service.getItemDefByProjectSlugAndEventId('my_shop', 'atc_2')
    ).resolves.toMatchObject({ fullItemDef: { item_id: 'sku_2' } });
  });
});
