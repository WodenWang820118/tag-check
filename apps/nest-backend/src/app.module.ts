import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControllerModule } from './controllers/controller.module';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilterModule } from './common/all-exceptions-filter/all-exceptions.filter.module';
import { AllExceptionsFilter } from './common/all-exceptions-filter/all-exceptions-filter.service';
import { HealthModule } from './common/health/health.module';
import { DatabaseConfigService } from './core/database/database.service';
import { DatabaseConfigModule } from './core/database/database.module';
import { LoggingInterceptorModule } from './common/logging-interceptor/logging-interceptor.module';
import { LoggingInterceptor } from './common/logging-interceptor/logging-interceptor.service';

@Module({
  imports: [
    DatabaseConfigModule,
    AllExceptionsFilterModule,
    ConfigModule.forRoot(),
    ControllerModule,
    TypeOrmModule.forRootAsync({
      imports: [DatabaseConfigModule],
      useFactory: (databaseConfigService: DatabaseConfigService) =>
        databaseConfigService.getTypeOrmConfig(),
      inject: [DatabaseConfigService]
    }),
    HealthModule,
    LoggingInterceptorModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: 'APP_INTERCEPTOR',
      useClass: LoggingInterceptor
    }
  ]
})
export class AppModule {}
