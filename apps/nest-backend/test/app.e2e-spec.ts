import request from 'supertest';
import { Test } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { AppModule } from '../src/app.module.js';
import { ExampleProjectRepositoryService } from '../src/features/example-project/example-project-repository.service';

/**
 * Boots the whole app against a temporary, migrated database and project
 * folder, seeds the example project and reads it back through the HTTP
 * routes. Runs (POST /datalayer/...) open a browser on the live example
 * site, so they are left to the desktop and Playwright checks.
 */
const SLUG = 'example-project-slug';
const workDir = mkdtempSync(join(tmpdir(), 'tag-check-e2e-'));
const rootProjectPath = join(workDir, 'tag_check_projects');

describe('App (e2e)', { timeout: 120000 }, () => {
  let app: NestFastifyApplication;
  let addToCartId: string;

  const get = (path: string) => request(app.getHttpServer()).get(path);

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_PATH = join(workDir, 'data.sqlite3');
    process.env.ROOT_PROJECT_PATH = rootProjectPath;

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();
    app = moduleFixture.createNestApplication(new FastifyAdapter());
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    await moduleFixture.get(ExampleProjectRepositoryService).ensureSeededOnce();
  }, 120000);

  afterAll(async () => {
    await app?.close();
    rmSync(workDir, { recursive: true, force: true });
  });

  describe('Configuration', () => {
    it('lists the configurations', async () => {
      const response = await get('/configurations');
      expect(response.status).toBe(200);
      expect(response.text.length).toBeGreaterThan(0);
    });

    it('reads rootProjectPath from the temporary folder', async () => {
      const response = await get('/configurations/rootProjectPath');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ value: rootProjectPath });
    });
  });

  describe('Startup', () => {
    it('reports the example project as seeded', async () => {
      const response = await get('/startup/project-seed-readiness');
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ ready: true });
    });
  });

  describe('Projects', () => {
    it('lists the example project', async () => {
      const response = await get('/projects');
      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.arrayContaining([expect.objectContaining({ projectSlug: SLUG })])
      );
    });

    it("reads the project's settings", async () => {
      const response = await get(`/settings/${SLUG}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ projectSlug: SLUG });
    });
  });

  describe('Reports', () => {
    it('lists every test as not run yet', async () => {
      const response = await get(`/reports/${SLUG}`);
      expect(response.status).toBe(200);
      const reports: {
        eventId: string;
        eventName: string;
        lastRunAt: unknown;
      }[] = response.body;
      expect(reports.length).toBeGreaterThan(0);
      expect(reports.every((report) => report.lastRunAt === null)).toBe(true);
      const addToCart = reports.find(
        (report) => report.eventName === 'add_to_cart'
      );
      expect(addToCart).toBeDefined();
      addToCartId = addToCart?.eventId ?? '';
    });

    it('lists no file reports before a run', async () => {
      const response = await get(`/file-reports/${SLUG}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('Recordings and specs', () => {
    it("lists the project's recordings", async () => {
      const response = await get(`/recordings/${SLUG}`);
      expect(response.status).toBe(200);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("reads a test's recording", async () => {
      const response = await get(`/recordings/${SLUG}/${addToCartId}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ title: 'add_to_cart' });
    });

    it("lists the project's specs", async () => {
      const response = await get(`/specs/${SLUG}`);
      expect(response.status).toBe(200);
      expect(response.body.projectSlug).toBe(SLUG);
      expect(response.body.specs.length).toBeGreaterThan(0);
    });

    it("reads a test's spec", async () => {
      const response = await get(`/specs/${SLUG}/${addToCartId}`);
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({ eventName: 'add_to_cart' });
    });

    it("reads a test's item definition", async () => {
      const response = await get(`/specs/${SLUG}/${addToCartId}/item-def`);
      expect(response.status).toBe(200);
      expect(response.body).toBeTruthy();
    });

    it('does not create an item definition for a missing test', async () => {
      const response = await request(app.getHttpServer())
        .put(`/specs/${SLUG}/no_such_test/item-def`)
        .send({ fullItemDef: { item_name: 'Scarf' } });
      expect(response.status).toBe(404);
      expect(response.body).toMatchObject({ message: 'Test not found' });
    });
  });

  describe('Media', () => {
    // The route answers an empty body rather than 404 when there is no file.
    it('serves an empty recording before a run', async () => {
      const response = await get(`/videos/${SLUG}/${addToCartId}`).responseType(
        'arraybuffer'
      );
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('video/webm');
      expect(Buffer.isBuffer(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });
});
