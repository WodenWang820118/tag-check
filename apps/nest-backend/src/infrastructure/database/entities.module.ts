import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_ENTITIES } from '../../core/database/database-entities';

/** Registers every entity's repository with TypeORM. */
@Module({
  imports: [TypeOrmModule.forFeature(DATABASE_ENTITIES)],
  exports: [TypeOrmModule]
})
export class EntitiesModule {}
