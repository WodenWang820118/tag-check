import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecordingEntity, TestEventEntity } from '../../../shared';
import { RecordingRepositoryService } from './recording-repository.service';

const modules = [TypeOrmModule.forFeature([RecordingEntity, TestEventEntity])];
const services = [RecordingRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class RecordingRepositoryModule {}
