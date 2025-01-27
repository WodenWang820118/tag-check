import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SpecEntity } from '../../../shared';
import { SpecRepositoryService } from './spec-repository.service';

const modules = [TypeOrmModule.forFeature([SpecEntity])];
const services = [SpecRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class RecordingRepositoryModule {}
