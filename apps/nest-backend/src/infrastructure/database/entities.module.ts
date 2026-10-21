import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_ENTITIES } from '../../core/database/database-entities';

@Module({
  imports: [TypeOrmModule.forFeature(DATABASE_ENTITIES)],
  exports: [TypeOrmModule]
})
export class EntitiesModule {}
