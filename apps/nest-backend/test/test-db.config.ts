// test-db.config.ts
import { DataSource, DataSourceOptions } from 'typeorm';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  FileReportEntity,
  ProjectEntity,
  RecordingEntity,
  SpecEntity,
  TestEventDetailEntity,
  TestEventEntity,
  TestImageEntity
} from '../src/shared';

export const testDbConfig: DataSourceOptions = {
  type: 'sqlite',
  database: ':memory:',
  entities: [
    TestEventEntity,
    TestImageEntity,
    ProjectEntity,
    AuthenticationSettingEntity,
    BrowserSettingEntity,
    ApplicationSettingEntity,
    RecordingEntity,
    SpecEntity,
    TestEventDetailEntity,
    FileReportEntity
  ], // Add all your entities here
  synchronize: true,
  dropSchema: true,
  logging: false
};

export const testDataSource = new DataSource(testDbConfig);
