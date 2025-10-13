import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControllerModule } from './controllers/controller.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilterModule } from './common/all-exceptions-filter/all-exceptions.filter.module';
import { AllExceptionsFilter } from './common/all-exceptions-filter/all-exceptions-filter.service';
import { DatabaseConfigService } from './core/database/database.service';
import { DatabaseConfigModule } from './core/database/database.module';
import { LoggingInterceptorModule } from './common/logging-interceptor/logging-interceptor.module';
import { LoggingInterceptor } from './common/logging-interceptor/logging-interceptor.service';
import { ConfigsModule } from './core/configs/configs.module';
import { CacheModule } from '@nestjs/cache-manager';
import { EntitiesModule } from './infrastructure/database/entities.module';
import { HealthModule } from './common/health/health.module';

@Module({
  imports: [
    // // Load ConfigModule first as other modules depend on it
    ConfigModule.forRoot({
      isGlobal: true // Make configuration globally available
    }),
    CacheModule.register({
      isGlobal: true
    }),

    // Core modules
    HealthModule,
    ConfigsModule,
    DatabaseConfigModule,

    // TypeORM configuration
    TypeOrmModule.forRootAsync({
      imports: [DatabaseConfigModule],
      useFactory: (databaseConfigService: DatabaseConfigService) =>
        databaseConfigService.getTypeOrmConfig(),
      inject: [DatabaseConfigService]
    }),

    // Feature modules
    ControllerModule,
    EntitiesModule,

    // Cross-cutting concerns
    AllExceptionsFilterModule,
    LoggingInterceptorModule
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor
    }
  ]
})
export class AppModule {}
