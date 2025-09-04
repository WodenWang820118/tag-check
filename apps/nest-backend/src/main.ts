import { NestFactory, LazyModuleLoader } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, INestApplication } from '@nestjs/common';
import { writeFileSync } from 'fs';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { app } from 'electron'; // It is for accessing the process.resourcesPath
import * as path from 'path';
import { json, urlencoded } from 'express';

async function bootstrap() {
  try {
    // Create the application with full logging in all environments
    const nestApp = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug']
    });

    // Configure CORS
    nestApp.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204
    });

    nestApp.use(json({ limit: '20mb' }));
    nestApp.use(urlencoded({ extended: true, limit: '20mb' }));

    // Retrieve the LazyModuleLoader using its class reference
    const lazyModuleLoader = nestApp.get(LazyModuleLoader);

    const { HealthModule } = await import('./common/health/health.module');

    // Use the official lazy loading method
    await lazyModuleLoader.load(() => HealthModule);

    // Swagger documentation for non-prod environments
    if (process.env.NODE_ENV !== 'prod') {
      const { SwaggerModule, DocumentBuilder } = await import(
        '@nestjs/swagger'
      );
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

    await nestApp.listen(port);
    Logger.log(
      `Application is running on port ${port} in ${process.env.NODE_ENV || 'default'} mode`
    );

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
    const errorLogPath =
      process.env.NODE_ENV === 'prod' && process.resourcesPath
        ? path.join(process.resourcesPath, 'error.log')
        : path.join(__dirname, 'error.log');

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

// Bootstrap with error handling
bootstrap().catch((err) => {
  Logger.error('Bootstrap function failed:', err);
  process.exit(1);
});
