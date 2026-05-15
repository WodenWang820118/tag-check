// Capture earliest timestamp possible (after this module body starts evaluating).
// Note: this is *not* true process start; for that we use process.uptime() below.
const STARTUP_T_MODULE_EVAL_MS = performance.now();

// Enable Node.js V8 compile cache (Node >= 22.8) BEFORE any other require/import
// is evaluated. This persists parsed bytecode of every subsequently-loaded
// module to disk, so the second-and-later cold start skips the V8 parse cost
// (which dominates our cold-start time, ~1.5s on a Windows laptop).
//
// The cache directory must be stable across launches. We honor an explicit
// NODE_COMPILE_CACHE env var (set by Tauri sidecar to a per-user data dir),
// otherwise we derive a deterministic location from DATABASE_PATH/ROOT_PROJECT_PATH
// (also stable across launches in the desktop app), with a final cwd-based fallback.
try {
  // Lazy require so we don't fail on Node versions that lack the API.

  const moduleApi = require('node:module') as {
    enableCompileCache?: (dir?: string) => { status: number; message?: string };
  };
  if (typeof moduleApi.enableCompileCache === 'function') {
    moduleApi.enableCompileCache(resolveCompileCacheDir());
  }
} catch {
  // Compile cache is a best-effort optimization; never fail startup.
}

function resolveCompileCacheDir(): string | undefined {
  // 1. Honor explicit override (set by Tauri sidecar / CI).
  if (process.env.NODE_COMPILE_CACHE) {
    return process.env.NODE_COMPILE_CACHE;
  }
  // 2. Derive from desktop-provided DATABASE_PATH (stable across launches).
  const dbPath = process.env.DATABASE_PATH;
  if (dbPath) {
    return joinPath(dirnamePath(dbPath), '.compile-cache');
  }
  // 3. Derive from ROOT_PROJECT_PATH.
  const rootPath = process.env.ROOT_PROJECT_PATH;
  if (rootPath) {
    return joinPath(dirnamePath(rootPath), '.compile-cache');
  }
  // 4. Let Node pick its default (NODE_COMPILE_CACHE not set + no arg => off).
  // Returning undefined here means we still call enableCompileCache() with no
  // dir, which makes Node fall back to its built-in default behavior.
  return undefined;
}

// Inline node:path helpers to avoid a require chain before compile-cache init.
function joinPath(a: string, b: string): string {
  return (require('node:path') as typeof import('node:path')).join(a, b);
}
function dirnamePath(p: string): string {
  return (require('node:path') as typeof import('node:path')).dirname(p);
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, INestApplication } from '@nestjs/common';
import { NativeLogger } from 'nestjs-pino';
import { writeFileSync } from 'fs';
import * as path from 'path';
import {
  FastifyAdapter,
  NestFastifyApplication
} from '@nestjs/platform-fastify';
import multipart from '@fastify/multipart';

const STARTUP_T_AFTER_IMPORTS_MS = performance.now();

interface StartupTimingReport {
  schema: 'startup-timing/v1';
  nodeEnv: string;
  pid: number;
  // Time from process start to entry of bootstrap() (process.uptime at bootstrap entry)
  processUptimeAtBootstrapEnterMs: number;
  // Wall-clock deltas measured via performance.now()
  moduleEvalToImportsDoneMs: number;
  importsDoneToBootstrapEnterMs: number;
  bootstrapEnterToNestCreateMs: number;
  nestCreateToListenMs: number;
  totalBootstrapMs: number;
  // Cumulative since module eval start
  totalSinceModuleEvalMs: number;
  port: number | string;
  timestamp: string;
}

function emitStartupTimingReport(report: StartupTimingReport): void {
  // Single-line tagged JSON so it can be grepped from logs / Tauri stdout.
  // Tag: STARTUP_TIMING so consumers (tests, Tauri, CI) can match deterministically.

  console.log(`STARTUP_TIMING ${JSON.stringify(report)}`);
  try {
    const outPath = resolveStartupTimingLogPath();
    writeFileSync(outPath, `${JSON.stringify(report)}\n`, { flag: 'a' });
  } catch {
    // Non-fatal: timing log is diagnostic only.
  }
}

function resolveStartupTimingLogPath(): string {
  if (process.env.STARTUP_TIMING_LOG) {
    return process.env.STARTUP_TIMING_LOG;
  }
  if (process.env.NODE_ENV === 'prod' && process.env.DATABASE_PATH) {
    return path.join(
      path.dirname(process.env.DATABASE_PATH),
      'startup-timing.log'
    );
  }
  return path.join(process.cwd(), 'startup-timing.log');
}

async function bootstrap() {
  const tBootstrapEnter = performance.now();
  const processUptimeAtBootstrapEnterMs = process.uptime() * 1000;
  try {
    // `bufferLogs: true` defers log emission until the logger is fully
    // configured (LoggerModule.forRoot + pino-http middleware), removing
    // per-line console I/O during the most expensive part of startup.
    // Log levels are controlled by pino (LOG_LEVEL env or 'info' default).
    const nestApp = await NestFactory.create<NestFastifyApplication>(
      AppModule,
      new FastifyAdapter({ bodyLimit: 20971520 }),
      { bufferLogs: true }
    );
    nestApp.useLogger(nestApp.get(NativeLogger));
    const tNestCreated = performance.now();

    // Configure CORS (NestJS wraps @fastify/cors automatically)
    nestApp.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204
    });

    // Register @fastify/multipart before listen (plugin must be registered before app starts)
    await nestApp.register(multipart, {
      limits: { fileSize: 20 * 1024 * 1024 }
    });

    // Swagger documentation for non-prod environments
    if (process.env.NODE_ENV !== 'prod') {
      const { SwaggerModule, DocumentBuilder } =
        await import('@nestjs/swagger');
      const config = new DocumentBuilder()
        .setTitle('Nest TagCheck')
        .setDescription('The Nest TagCheck API description')
        .setVersion('1.0')
        .addTag('datalayer')
        .build();
      const document = SwaggerModule.createDocument(nestApp, config);
      SwaggerModule.setup('api', nestApp, document);
    }

    // Port configuration with environment awareness
    const port = process.env.PORT || getDefaultPort();

    // Fastify defaults to 127.0.0.1; must specify '0.0.0.0' for Tauri sidecar access
    await nestApp.listen(port, '0.0.0.0');
    const tListen = performance.now();
    Logger.log(
      `Application is running on port ${port} in ${process.env.NODE_ENV || 'default'} mode`
    );

    emitStartupTimingReport({
      schema: 'startup-timing/v1',
      nodeEnv: process.env.NODE_ENV || 'default',
      pid: process.pid,
      processUptimeAtBootstrapEnterMs,
      moduleEvalToImportsDoneMs:
        STARTUP_T_AFTER_IMPORTS_MS - STARTUP_T_MODULE_EVAL_MS,
      importsDoneToBootstrapEnterMs:
        tBootstrapEnter - STARTUP_T_AFTER_IMPORTS_MS,
      bootstrapEnterToNestCreateMs: tNestCreated - tBootstrapEnter,
      nestCreateToListenMs: tListen - tNestCreated,
      totalBootstrapMs: tListen - tBootstrapEnter,
      totalSinceModuleEvalMs: tListen - STARTUP_T_MODULE_EVAL_MS,
      port: port,
      timestamp: new Date().toISOString()
    });

    // Graceful shutdown handling
    setupGracefulShutdown(nestApp);
  } catch (error) {
    handleFatalError(error instanceof Error ? error : new Error(String(error)));
  }
}

function getDefaultPort(): number {
  switch (process.env.NODE_ENV) {
    case 'dev':
      return 7070;
    case 'staging':
    case 'test':
      return 6060;
    default:
      return 7001;
  }
}

function setupGracefulShutdown(nestApp: INestApplication): void {
  process.on('SIGTERM', () => {
    nestApp
      .close()
      .then(() => {
        Logger.log('Application shut down gracefully');
        process.exit(0);
      })
      .catch((error) => {
        Logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      });
  });
}

function handleFatalError(error: Error): void {
  Logger.error('Failed to start application:', error);

  try {
    const errorLogPath = resolveFatalErrorLogPath();

    writeFileSync(
      errorLogPath,
      `${new Date().toISOString()}: ${error.stack || error.message}`,
      'utf-8'
    );
  } catch (logError) {
    Logger.error('Failed to write error log:', logError);
  }

  process.exit(1);
}

function resolveFatalErrorLogPath(): string {
  if (process.env.NODE_ENV !== 'prod') {
    return path.join(__dirname, 'error.log');
  }

  if (process.env.DATABASE_PATH) {
    return path.join(path.dirname(process.env.DATABASE_PATH), 'error.log');
  }

  if (process.env.ROOT_PROJECT_PATH) {
    return path.join(path.dirname(process.env.ROOT_PROJECT_PATH), 'error.log');
  }

  return path.join(process.cwd(), 'error.log');
}

// Bootstrap with error handling
bootstrap().catch((err) => {
  Logger.error('Bootstrap function failed:', err);
  process.exit(1);
});
