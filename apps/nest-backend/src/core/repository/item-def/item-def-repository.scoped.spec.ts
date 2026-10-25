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

describe('ItemDefRepositoryService scoped to one test (SQLite)', () => {
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

  it("saving project A's definition leaves project B's of the same event unchanged", async () => {
    const shop = await addToCartTest('my_shop', 'atc');
    await defineItem(shop, 'add_to_cart');
    const copy = await addToCartTest('my_shop_copy', 'atc');
    await defineItem(copy, 'add_to_cart');

    await expect(
      service.saveItemDefByProjectSlugAndEventId('my_shop', 'atc', {
        fullItemDef: { item_id: 'SKU_SOCKS' }
      })
    ).resolves.toEqual({
      itemId: 'add_to_cart',
      templateName: 'add_to_cart items',
      fullItemDef: { item_id: 'SKU_SOCKS' }
    });

    await expect(
      service.getItemDefByProjectSlugAndEventId('my_shop', 'atc')
    ).resolves.toMatchObject({ fullItemDef: { item_id: 'SKU_SOCKS' } });
    await expect(
      service.getItemDefByProjectSlugAndEventId('my_shop_copy', 'atc')
    ).resolves.toMatchObject({ fullItemDef: { item_id: 'add_to_cart' } });
    await expect(dataSource.manager.count(ItemDefEntity)).resolves.toBe(2);
  });

  it('creates the definition of a test that has none, beside a same-named one elsewhere', async () => {
    const example = await addToCartTest('ng_gtm_integration_sample', 'atc');
    await defineItem(example, 'add_to_cart');
    await addToCartTest('my_shop', 'atc');

    await expect(
      service.saveItemDefByProjectSlugAndEventId('my_shop', 'atc', {
        fullItemDef: { item_id: 'SKU_HAT' }
      })
    ).resolves.toEqual({
      itemId: 'add_to_cart',
      templateName: 'add_to_cart',
      fullItemDef: { item_id: 'SKU_HAT' }
    });

    await expect(
      service.getItemDefByProjectSlugAndEventId(
        'ng_gtm_integration_sample',
        'atc'
      )
    ).resolves.toMatchObject({ fullItemDef: { item_id: 'add_to_cart' } });
    await expect(dataSource.manager.count(ItemDefEntity)).resolves.toBe(2);
  });

  it('updates only its own test of two in one project', async () => {
    const first = await addToCartTest('my_shop', 'atc_1');
    await defineItem(first, 'add_to_cart');
    const second = await addToCartTest('my_shop', 'atc_2');
    await defineItem(second, 'add_to_cart');

    await service.saveItemDefByProjectSlugAndEventId('my_shop', 'atc_2', {
      itemId: 'sku_2',
      templateName: 'second',
      fullItemDef: { item_id: 'sku_2' }
    });

    await expect(
      service.getItemDefByProjectSlugAndEventId('my_shop', 'atc_1')
    ).resolves.toEqual({
      itemId: 'add_to_cart',
      templateName: 'add_to_cart items',
      fullItemDef: { item_id: 'add_to_cart' }
    });
    await expect(
      service.getItemDefByProjectSlugAndEventId('my_shop', 'atc_2')
    ).resolves.toEqual({
      itemId: 'sku_2',
      templateName: 'second',
      fullItemDef: { item_id: 'sku_2' }
    });
  });

  it('rejects a test the project does not have with 404', async () => {
    await addToCartTest('my_shop', 'atc');

    await expect(
      service.saveItemDefByProjectSlugAndEventId('other_shop', 'atc', {
        fullItemDef: {}
      })
    ).rejects.toMatchObject({ status: 404 });
    await expect(dataSource.manager.count(ItemDefEntity)).resolves.toBe(0);
  });
});
