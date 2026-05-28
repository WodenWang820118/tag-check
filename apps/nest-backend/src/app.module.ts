import { Logger, Module } from '@nestjs/common';
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

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function normalizeClientRequestId(
  header: string | string[] | number | undefined
): string | undefined {
  const value = Array.isArray(header) ? header[0] : header;
  if (typeof value !== 'string') return undefined;
  if (REQUEST_ID_PATTERN.test(value)) {
    return value;
  }

  Logger.warn(
    `Rejected malformed x-request-id header; length=${value.length}`,
    'RequestId'
  );
  return undefined;
}

function readRequestId(req: {
  id?: unknown;
  headers?: Record<string, string | string[] | number | undefined>;
}): string | undefined {
  const headerRequestId = normalizeClientRequestId(
    req.headers?.['x-request-id']
  );
  return headerRequestId === undefined
    ? req.id === undefined
      ? undefined
      : String(req.id)
    : String(headerRequestId);
}

function sanitizeHttpPath(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) return rawUrl;
  try {
    return new URL(rawUrl, 'http://localhost').pathname;
  } catch {
    return rawUrl.split('?')[0] || rawUrl;
  }
}

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
          normalizeClientRequestId(req.headers['x-request-id']) || randomUUID(),
        // Redact sensitive headers; never log request/response bodies
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers["x-api-key"]',
            'res.headers["set-cookie"]'
          ],
          remove: true
        },
        serializers: {
          req: (req) => ({
            id: readRequestId(req),
            method: req.method,
            url: sanitizeHttpPath(req.url)
          })
        },
        // Only log method, url, statusCode, responseTime, and request id
        customSuccessObject: (req, res, val) => ({
          req: {
            id: readRequestId(req),
            method: req.method,
            url: sanitizeHttpPath(req.url)
          },
          res: { statusCode: res.statusCode },
          responseTime: val.responseTime
        }),
        customErrorObject: (req, res, error, val) => ({
          req: {
            id: readRequestId(req),
            method: req.method,
            url: sanitizeHttpPath(req.url)
          },
          res: { statusCode: res.statusCode },
          responseTime: val.responseTime,
          err: {
            type: error.constructor?.name,
            message: error.message,
            stack: error.stack
          }
        }),
        customReceivedObject: (req) => ({
          req: {
            id: readRequestId(req),
            method: req.method,
            url: sanitizeHttpPath(req.url)
          }
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
