import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'path';

// TODO: run all endoint tests to ensure they are all working

const rootProjectPath = join(__dirname, '..', '..', '..', 'tag_check_projects');

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Configuration (GET)', () => {
    it('should get all configurations', async () => {
      const response = await request(app.getHttpServer()).get(
        '/configurations'
      );

      expect(response.status).toBe(200);
      expect(response.text).length.greaterThan(0);
    });
    it('should get the rootProjectPath value', async () => {
      const response = await request(app.getHttpServer()).get(
        '/configurations/rootProjectPath'
      );
      expect(response.status).toBe(200);
      expect(JSON.parse(response.text)).toEqual({ value: rootProjectPath });
    });
  });

  describe('Data Layer (POST)', () => {
    it('should return dataLayer examination result', async () => {
      const response = await request(app.getHttpServer())
        .post(
          '/datalayer/ng_gtm_integration_sample/add_to_cart_fda47993-f581-42f5-ac52-f40ffb43bfb8'
        )
        .query({ headless: 'true', measurementId: 'GTM-NBMX2DWS' })
        .send({
          application: {
            localStorage: {
              data: [
                {
                  key: 'consentPreferences',
                  value: {
                    ad_storage: true,
                    analytics_storage: true,
                    ad_user_data: true,
                    ad_personalization: false,
                  },
                },
                {
                  key: 'consent',
                  value: true,
                },
              ],
            },
            cookie: {
              data: [],
            },
          },
          puppeteerArgs: [
            '--window-size=1440,900',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--incognito',
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body).toBeDefined();
    });
  });

  describe('Recordings (GET)', () => {
    it('should get recordings according to the projectSlug', async () => {
      const response = await request(app.getHttpServer()).get(
        '/recordings/ng_gtm_integration_sample'
      );
      expect(response.status).toBe(200);
      // expect(response).toEqual(0);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
