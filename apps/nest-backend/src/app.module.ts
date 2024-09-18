import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaiterModule } from './waiter/waiter.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './all-exceptions-filter';
import { HealthModule } from './health/health.module';
import { DatabaseConfigService } from './database/database.service';
import { DatabaseConfigModule } from './database/database.module';

@Module({
  imports: [
    DatabaseConfigModule,
    ConfigModule.forRoot(),
    WaiterModule,
    SequelizeModule.forRootAsync({
      imports: [DatabaseConfigModule],
      useFactory: (databaseConfigService: DatabaseConfigService) =>
        databaseConfigService.getDatabaseConfig(),
      inject: [DatabaseConfigService],
    }),
    HealthModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
