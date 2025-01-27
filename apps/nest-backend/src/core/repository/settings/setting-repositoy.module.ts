import { Module } from '@nestjs/common';
import { ApplicationSettingRepositoryService } from './application-setting-repository.service';
import { AuthenticationSettingRepositoryService } from './authentication-setting-repository.service';
import { BrowserSettingRepositoryService } from './browser-setting-repository.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApplicationSettingEntity,
  AuthenticationSettingEntity,
  BrowserSettingEntity
} from '../../../shared';

const modules = [
  TypeOrmModule.forFeature([
    ApplicationSettingEntity,
    AuthenticationSettingEntity,
    BrowserSettingEntity
  ])
];

const services = [
  ApplicationSettingRepositoryService,
  AuthenticationSettingRepositoryService,
  BrowserSettingRepositoryService
];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class SettingRepositoryModule {}
