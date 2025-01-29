// test-db.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import { TestFileReportEntity } from '../src/shared/entity/test-file-report.entity';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ProjectEntity,
  RecordingEntity,
  SpecEntity,
  TestDataLayerEntity,
  TestEventEntity,
  TestImageEntity,
  TestInfoEntity,
  TestRequestInfoEntity
} from '../src/shared';

export const testDbConfig: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [
    TestFileReportEntity,
    TestEventEntity,
    TestDataLayerEntity,
    TestImageEntity,
    TestInfoEntity,
    TestRequestInfoEntity,
    ProjectEntity,
    AuthenticationSettingEntity,
    BrowserSettingEntity,
    ApplicationSettingEntity,
    RecordingEntity,
    SpecEntity
  ], // Add all your entities here
  synchronize: true,
  dropSchema: true,
  logging: false
};

export const testDataSource = new DataSource(testDbConfig);
