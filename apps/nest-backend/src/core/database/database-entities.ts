import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BatchRunEntity,
  BatchRunItemEntity,
  BrowserSettingEntity,
  ItemDefEntity,
  ProjectEntity,
  RecordingEntity,
  ScheduleEntity,
  SpecEntity,
  SysConfigurationEntity,
  TestEventDetailEntity,
  TestEventEntity,
  TestImageEntity
} from '../../shared';

/** Every table of the database; the migrations create exactly these. */
export const DATABASE_ENTITIES = [
  ProjectEntity,
  TestEventEntity,
  SpecEntity,
  RecordingEntity,
  ItemDefEntity,
  TestEventDetailEntity,
  TestImageEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity,
  ApplicationSettingEntity,
  SysConfigurationEntity,
  ScheduleEntity,
  BatchRunEntity,
  BatchRunItemEntity
];
