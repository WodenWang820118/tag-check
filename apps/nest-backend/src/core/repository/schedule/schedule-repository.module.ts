import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleEntity } from '../../../shared';
import { ScheduleRepositoryService } from './schedule-repository.service';

const modules = [TypeOrmModule.forFeature([ScheduleEntity])];
const services = [ScheduleRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class ScheduleRepositoryModule {}
