/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from './../src/app.module';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { join } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { testDbConfig } from './test-db.config';
import { DataSource } from 'typeorm';
import { vi } from 'vitest';
import { entities } from './common';
// TODO: run all endoint tests to ensure they are all working

const rootProjectPath = join(__dirname, '..', '..', '..', 'tag_check_projects');

describe('App (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  vi.setConfig({ testTimeout: 120000 });

  beforeAll(async () => {
    process.env.NODE_ENV = 'test'; // Ensure test environment is set

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        AppModule,
        TypeOrmModule.forRoot(testDbConfig),
        TypeOrmModule.forFeature(entities)
      ],
      providers: []
    })
      .overrideProvider(DataSource)
      .useValue(dataSource)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);
    await dataSource.synchronize(true);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Environment', () => {
    it('should be the test environment', () => {
      expect(process.env.NODE_ENV).toBe('test');
    });
  });

  describe('Configuration', () => {
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

  // describe('Data Layer', () => {
  //   it('should return dataLayer examination result', async () => {
  //     // TODO: will need to be refactored
  //     const response = await request(app.getHttpServer())
  //       .post(
  //         '/datalayer/ng_gtm_integration_sample/page_view_54aab8c1-b641-49b9-9ad9-dad029fb1bec'
  //       )
  //       .query({ headless: 'true', measurementId: '' })
  //       .send({
  //         application: {
  //           localStorage: {
  //             data: [
  //               {
  //                 key: 'consentPreferences',
  //                 value: {
  //                   ad_storage: true,
  //                   analytics_storage: true,
  //                   ad_user_data: true,
  //                   ad_personalization: false
  //                 }
  //               },
  //               {
  //                 key: 'consent',
  //                 value: true
  //               }
  //             ]
  //           },
  //           cookie: {
  //             data: []
  //           }
  //         },
  //         puppeteerArgs: [
  //           '--window-size=1440,900',
  //           '--no-sandbox',
  //           '--disable-setuid-sandbox',
  //           '--disable-dev-shm-usage',
  //           '--disable-accelerated-2d-canvas',
  //           '--disable-gpu',
  //           '--incognito'
  //         ]
  //       });

  //     expect(response.status).toBe(201);
  //     expect(response.body).toBeDefined();
  //   });

  //   // TODO: it should save data in the database after running the previous test
  //   // so run the query and check if the data is saved in the database
  // });

  describe('Recordings', () => {
    it('should get recordings according to the projectSlug', async () => {
      const response = await request(app.getHttpServer()).get(
        '/recordings/ng_gtm_integration_sample'
      );
      expect(response.status).toBe(200);
      // expect(response).toEqual(0);
    });
  });

  describe('File Reports', () => {
    it('should get all file reports according to the projectSlug', async () => {
      const response = await request(app.getHttpServer()).get(
        '/file-reports/ng_gtm_integration_sample'
      );

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });
  });

  // describe('Project', () => {
  //   it('should get all projects metadata', async () => {
  //     const response = await request(app.getHttpServer()).get(
  //       '/projects/ng_gtm_integration_sample'
  //     );
  //     expect(response.status).toBe(200);
  //     expect(response.body).toBeDefined();
  //   });
  // });

  // describe('Reports', () => {
  //   it('should get all reports for a project', async () => {
  //     //TODO: implementation
  //     const response = await request(app.getHttpServer()).get(
  //       '/reports/ng_gtm_integration_sample'
  //     );
  //     console.log(response);
  //     expect(response.status).toBe(200);
  //     expect(response.body).toBeDefined();
  //   });
  // });

  // describe('Settings', () => {
  //   it('should get project settings according to the projectSlug', async () => {
  //     const response = await request(app.getHttpServer()).get(
  //       '/settings/ng_gtm_integration_sample'
  //     );
  //     expect(response.status).toBe(200);
  //     expect(response.body).toBeDefined();
  //   });
  // });

  // describe('Specs', () => {
  //   it('should get all specs according to the projectSlug', async () => {
  //     const response = await request(app.getHttpServer()).get(
  //       '/specs/ng_gtm_integration_sample'
  //     );
  //     expect(response.status).toBe(200);
  //     expect(response.body).toBeDefined();
  //   });
  // });

  // describe('Videos', () => {
  //   it('should get video according to the projectSlug and eventId', async () => {
  //     const response = await request(app.getHttpServer()).get(
  //       '/videos/ng_gtm_integration_sample/page_view_54aab8c1-b641-49b9-9ad9-dad029fb1bec'
  //     );
  //     expect(response.status).toBe(200);
  //     expect(response.body).toBeDefined();
  //   });
  // });

  afterAll(async () => {
    await app.close();
  });
});
