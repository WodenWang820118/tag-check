import {
  TestEventEntity,
  TestImageEntity,
  ProjectEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  RecordingEntity,
  SpecEntity,
  TestEventDetailEntity,
  SysConfigurationEntity,
  ItemDefEntity
} from '../../src/shared/index.js';

export const entities = [
  TestEventEntity,
  TestImageEntity,
  ProjectEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  RecordingEntity,
  SpecEntity,
  TestEventDetailEntity,
  // Added ItemDefEntity to ensure relation in TestEventEntity resolves during e2e bootstrap
  // (TestEventEntity -> ItemDefEntity)
  ItemDefEntity,
  SysConfigurationEntity
];
