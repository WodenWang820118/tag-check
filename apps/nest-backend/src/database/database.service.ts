import { Injectable } from '@nestjs/common';
import { SequelizeOptions } from 'sequelize-typescript';
import { ConfigsService } from '../configs/configs.service';

@Injectable()
export class DatabaseConfigService {
  constructor(private configsService: ConfigsService) {}

  getDatabaseConfig(): Partial<
    {
      name?: string;
      retryAttempts?: number;
      retryDelay?: number;
      autoLoadModels?: boolean;
      synchronize?: boolean;
      uri?: string;
    } & Partial<SequelizeOptions>
  > {
    return {
      dialect: 'sqlite',
      storage: this.configsService.getDatabasePath(),
      autoLoadModels: true,
      synchronize: true,
    };
  }
}
