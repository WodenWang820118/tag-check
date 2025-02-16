import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecEntity, TestEventEntity } from '../../../shared';
import { SpecRepositoryService } from './spec-repository.service';

const modules = [TypeOrmModule.forFeature([SpecEntity, TestEventEntity])];
const services = [SpecRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class SpecRepositoryModule {}
