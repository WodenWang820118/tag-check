import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaiterModule } from './waiter/waiter.module';
import { dataBaseConfig } from './database/database.config';
import { SequelizeModule } from '@nestjs/sequelize';
// import { SentryModule } from '@sentry/nestjs/setup';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from './all-exceptions-filter';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WaiterModule,
    SequelizeModule.forRoot(dataBaseConfig),
    // SentryModule.forRoot(),
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
