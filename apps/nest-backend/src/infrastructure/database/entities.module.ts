import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectEntity } from '../../shared/entity/project.entity';
import { TestEventEntity } from '../../shared/entity/test-event.entity';
import { SpecEntity } from '../../shared/entity/spec.entity';
import { RecordingEntity } from '../../shared/entity/recording.entity';
import { ItemDefEntity } from '../../shared/entity/item-def.entity';
import { TestEventDetailEntity } from '../../shared/entity/test-event-detail.entity';
import { TestImageEntity } from '../../shared/entity/test-image.entity';
import { AuthenticationSettingEntity } from '../../shared/entity/authentication-setting.entity';
import { BrowserSettingEntity } from '../../shared/entity/browser-setting.entity';
import { ApplicationSettingEntity } from '../../shared/entity/application-setting.entity';
import { SysConfigurationEntity } from '../../shared/entity/sys-configuration.entity';

const entities = [
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
  SysConfigurationEntity
];

@Module({
  imports: [TypeOrmModule.forFeature(entities)],
  exports: [TypeOrmModule]
})
export class EntitiesModule {}
