import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ItemDefEntity } from '../../../shared';
import { ItemDefRepositoryService } from './item-def-repository.service';

const modules = [TypeOrmModule.forFeature([ItemDefEntity])];
const services = [ItemDefRepositoryService];

@Module({
  imports: [...modules],
  providers: [...services],
  exports: [...services, ...modules]
})
export class ItemDefRepositoryModule {}
