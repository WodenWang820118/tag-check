import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaiterModule } from './waiter/waiter.module';
import { SequelizeModule } from '@nestjs/sequelize';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilterModule } from './all-exceptions-filter/all-exceptions.filter.module';
import { AllExceptionsFilter } from './all-exceptions-filter/all-exceptions-filter.service';
import { HealthModule } from './health/health.module';
import { DatabaseConfigService } from './database/database.service';
import { DatabaseConfigModule } from './database/database.module';
import { LoggingInterceptorModule } from './logging-interceptor/logging-interceptor.module';
import { LoggingInterceptor } from './logging-interceptor/logging-interceptor.service';

@Module({
  imports: [
    DatabaseConfigModule,
    AllExceptionsFilterModule,
    ConfigModule.forRoot(),
    WaiterModule,
    SequelizeModule.forRootAsync({
      imports: [DatabaseConfigModule],
      useFactory: (databaseConfigService: DatabaseConfigService) =>
        databaseConfigService.getDatabaseConfig(),
      inject: [DatabaseConfigService],
    }),
    HealthModule,
    LoggingInterceptorModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
