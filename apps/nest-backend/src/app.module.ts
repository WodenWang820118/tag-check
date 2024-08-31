import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaiterModule } from './waiter/waiter.module';
import { dataBaseConfig } from './database/database.config';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WaiterModule,
    SequelizeModule.forRoot(dataBaseConfig),
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
