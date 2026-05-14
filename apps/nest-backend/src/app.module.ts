import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ControllerModule } from './controllers/controller.module';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilterModule } from './common/all-exceptions-filter/all-exceptions.filter.module';
import { AllExceptionsFilter } from './common/all-exceptions-filter/all-exceptions-filter.service';
import { DatabaseConfigService } from './core/database/database.service';
import { DatabaseConfigModule } from './core/database/database.module';
import { LoggerModule, LoggerErrorInterceptor } from 'nestjs-pino';
import { ConfigsModule } from './core/configs/configs.module';
import { CacheModule } from '@nestjs/cache-manager';
import { EntitiesModule } from './infrastructure/database/entities.module';
import { HealthModule } from './common/health/health.module';
import { randomUUID } from 'node:crypto';

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

    // Structured JSON logging via pino (app-wide backend + HTTP middleware)
    LoggerModule.forRoot({
      pinoHttp: {
        // Use x-request-id header when present; auto-generate otherwise
        genReqId: (req) =>
          (req.headers['x-request-id'] as string | undefined) || randomUUID(),
        // Redact sensitive headers; never log request/response bodies
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'res.headers["set-cookie"]'
          ],
          remove: true
        },
        // Only log method, url, statusCode, responseTime, and request id
        customSuccessObject: (req, res, val) => ({
          req: { id: req.id, method: req.method, url: req.url },
          res: { statusCode: res.statusCode },
          responseTime: val.responseTime
        }),
        customErrorObject: (req, res, error, val) => ({
          req: { id: req.id, method: req.method, url: req.url },
          res: { statusCode: res.statusCode },
          responseTime: val.responseTime,
          err: {
            type: error.constructor?.name,
            message: error.message,
            stack: error.stack
          }
        }),
        customReceivedObject: (req) => ({
          req: { id: req.id, method: req.method, url: req.url }
        })
      }
    })
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggerErrorInterceptor
    }
  ]
})
export class AppModule {}
