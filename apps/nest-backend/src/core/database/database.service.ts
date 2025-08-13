import { Injectable } from '@nestjs/common';
import { ConfigsService } from '../configs/configs.service';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configsService: ConfigsService) {}

  getTypeOrmConfig(): TypeOrmModuleOptions {
    // Determine if database logging is enabled via environment variable
    const enableDbLogging = process.env.DB_LOGGING === 'true';
    return {
      type: 'sqlite',
      database: this.configsService.getDatabasePath(),
      autoLoadEntities: true,
      synchronize: true,
      logging: enableDbLogging,
      retryAttempts: 10,
      retryDelay: 3000
    };
  }
}
