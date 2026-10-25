import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DATABASE_ENTITIES } from '../../database/database-entities';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ProjectEntity
} from '../../../shared';
import { ProjectRepositoryService } from './project-repository.service';

describe('ProjectRepositoryService.getRunSettingsEntityBySlug (SQLite)', () => {
  let moduleRef: TestingModule;
  let service: ProjectRepositoryService;
  let dataSource: DataSource;

  beforeEach(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: DATABASE_ENTITIES,
          synchronize: true,
          dropSchema: true,
          logging: false
        }),
        TypeOrmModule.forFeature([ProjectEntity])
      ],
      providers: [ProjectRepositoryService]
    }).compile();
    service = moduleRef.get(ProjectRepositoryService);
    dataSource = moduleRef.get(DataSource);
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('reads every setting a run needs, the password included', async () => {
    const project = await dataSource.manager.save(ProjectEntity, {
      projectSlug: 'shop',
      projectName: 'Shop',
      measurementId: 'G-1'
    });
    await dataSource.manager.save(AuthenticationSettingEntity, {
      project,
      username: 'qa',
      password: 'secret'
    });
    await dataSource.manager.save(BrowserSettingEntity, {
      project,
      browser: ['--lang=en'],
      headless: true
    });
    await dataSource.manager.save(ApplicationSettingEntity, {
      project,
      localStorage: { data: [] },
      cookie: { data: [] },
      gtm: {
        isAccompanyMode: true,
        isRequestCheck: false,
        tagManagerUrl: '',
        gtmPreviewModeUrl: 'https://gtm'
      },
      websiteUrl: 'https://shop.example/'
    });

    const entity = await service.getRunSettingsEntityBySlug('shop');

    expect(entity.authenticationSettings).toMatchObject({
      username: 'qa',
      password: 'secret'
    });
    expect(entity.browserSettings).toMatchObject({
      browser: ['--lang=en'],
      headless: true
    });
    expect(entity.applicationSettings.gtm).toMatchObject({
      isAccompanyMode: true,
      gtmPreviewModeUrl: 'https://gtm'
    });
    // Other reads still leave the password out.
    const settings = await service.getSettingBySlug('shop');
    expect(settings.authenticationSettings?.password).toBeUndefined();
  });

  it('answers 404 for an unknown project', async () => {
    await expect(service.getRunSettingsEntityBySlug('nope')).rejects.toThrow(
      'Project not found'
    );
  });
});
