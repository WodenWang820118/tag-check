import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
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
} from '../../shared';
import { ItemDefRepositoryService } from '../../core/repository/item-def/item-def-repository.service';
import { SpecRepositoryService } from '../../core/repository/spec/spec-repository.service';
import { ProjectSpecService } from '../../features/project-agent/project-spec/project-spec.service';
import { ProjectFacadeRepositoryService } from '../../features/repository/project-facade/project-facade-repository.service';
import { SpecController } from './spec.controller';

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

/**
 * The item definition routes over HTTP, on SQLite. The spec routes share
 * the `/specs/:projectSlug/:eventId` prefix, so a stub records whether a
 * request reached them instead.
 */
describe('SpecController item definition routes (HTTP, SQLite)', () => {
  let app: NestFastifyApplication;
  let dataSource: DataSource;
  const specCalls: string[] = [];

  beforeEach(async () => {
    specCalls.length = 0;
    const module = await Test.createTestingModule({
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
      controllers: [SpecController],
      providers: [
        ItemDefRepositoryService,
        {
          provide: SpecRepositoryService,
          useValue: {
            getSpecByProjectSlugAndEventId: (slug: string, id: string) => {
              specCalls.push(`GET ${slug}/${id}`);
              return { event: id };
            }
          }
        },
        {
          provide: ProjectFacadeRepositoryService,
          useValue: {
            updateSpec: (slug: string, id: string) => {
              specCalls.push(`PUT ${slug}/${id}`);
              return { event: id };
            }
          }
        },
        { provide: ProjectSpecService, useValue: {} }
      ]
    }).compile();

    app = module.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter()
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
    dataSource = module.get(DataSource);
  });

  afterEach(async () => {
    await app?.close();
  });

  async function addToCartTest(projectSlug: string) {
    const project = await dataSource.manager.save(ProjectEntity, {
      projectSlug,
      projectName: projectSlug
    });
    return await dataSource.manager.save(TestEventEntity, {
      project,
      eventId: 'add_to_cart_1',
      eventName: 'add_to_cart',
      testName: 'Add to cart',
      message: 'This is a standard test'
    });
  }

  async function defineItem(testEvent: TestEventEntity, itemName: string) {
    await dataSource.manager.save(ItemDefEntity, {
      testEvent,
      itemId: 'add_to_cart',
      templateName: 'add_to_cart',
      fullItemDef: { item_name: itemName }
    });
  }

  it("PUT /specs/:projectSlug/:eventId/item-def leaves another project's definition unchanged", async () => {
    await defineItem(await addToCartTest('shop_a'), 'Socks');
    await defineItem(await addToCartTest('shop_b'), 'Hat');

    const put = await app.inject({
      method: 'PUT',
      url: '/specs/shop_a/add_to_cart_1/item-def',
      payload: { fullItemDef: { item_name: 'Scarf' } }
    });
    expect(put.statusCode).toBe(200);
    expect(put.json()).toEqual({
      itemId: 'add_to_cart',
      templateName: 'add_to_cart',
      fullItemDef: { item_name: 'Scarf' }
    });

    const a = await app.inject({
      method: 'GET',
      url: '/specs/shop_a/add_to_cart_1/item-def'
    });
    const b = await app.inject({
      method: 'GET',
      url: '/specs/shop_b/add_to_cart_1/item-def'
    });
    expect(a.json()).toMatchObject({ fullItemDef: { item_name: 'Scarf' } });
    expect(b.json()).toMatchObject({ fullItemDef: { item_name: 'Hat' } });
    expect(specCalls).toEqual([]);
  });

  it('PUT creates the definition of a test that has none', async () => {
    await defineItem(await addToCartTest('shop_a'), 'Socks');
    await addToCartTest('shop_b');

    const empty = await app.inject({
      method: 'GET',
      url: '/specs/shop_b/add_to_cart_1/item-def'
    });
    expect(empty.statusCode).toBe(200);
    expect(empty.json()).toBeNull();

    const put = await app.inject({
      method: 'PUT',
      url: '/specs/shop_b/add_to_cart_1/item-def',
      payload: { itemId: 'add_to_cart', fullItemDef: { item_name: 'Hat' } }
    });
    expect(put.statusCode).toBe(200);

    await expect(dataSource.manager.count(ItemDefEntity)).resolves.toBe(2);
    const a = await app.inject({
      method: 'GET',
      url: '/specs/shop_a/add_to_cart_1/item-def'
    });
    expect(a.json()).toMatchObject({ fullItemDef: { item_name: 'Socks' } });
  });

  it('PUT answers 404 for a test the project does not have', async () => {
    await addToCartTest('shop_a');

    const put = await app.inject({
      method: 'PUT',
      url: '/specs/shop_a/purchase_1/item-def',
      payload: { fullItemDef: {} }
    });
    expect(put.statusCode).toBe(404);
  });

  it('leaves /specs/:projectSlug/:eventId to the spec routes', async () => {
    const get = await app.inject({
      method: 'GET',
      url: '/specs/shop_a/item-def'
    });
    const put = await app.inject({
      method: 'PUT',
      url: '/specs/shop_a/item-def',
      payload: { event: 'item-def' }
    });

    expect(get.json()).toEqual({ event: 'item-def' });
    expect(put.json()).toEqual({ event: 'item-def' });
    expect(specCalls).toEqual(['GET shop_a/item-def', 'PUT shop_a/item-def']);
  });
});
