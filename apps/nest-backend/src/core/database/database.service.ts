import { Injectable } from '@nestjs/common';
import { ConfigsService } from '../configs/configs.service';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { DATABASE_ENTITIES } from './database-entities';
import { DATABASE_MIGRATIONS } from './database-migrations';

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configsService: ConfigsService) {}

  getTypeOrmConfig(): TypeOrmModuleOptions {
    // Determine if database logging is enabled via environment variable
    const enableDbLogging = process.env.DB_LOGGING === 'true';
    return {
      type: 'sqlite',
      database: this.configsService.getDatabasePath(),
      entities: DATABASE_ENTITIES,
      // The schema comes from the migrations; migrateDatabase runs them.
      migrations: DATABASE_MIGRATIONS,
      synchronize: false,
      migrationsRun: false,
      logging: enableDbLogging,
      retryAttempts: 10,
      retryDelay: 3000
    };
  }
}
