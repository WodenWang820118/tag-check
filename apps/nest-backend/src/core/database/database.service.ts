import { Injectable } from '@nestjs/common';
import { ConfigsService } from '../configs/configs.service';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

@Injectable()
export class DatabaseConfigService {
  constructor(private readonly configsService: ConfigsService) {}

  getTypeOrmConfig(): TypeOrmModuleOptions {
    return {
      type: 'sqlite',
      database: this.configsService.getDatabasePath(),
      autoLoadEntities: true,
      synchronize: true,
      logging: false, // TODO: use args to toggle
      retryAttempts: 10,
      retryDelay: 3000
    };
  }
}
