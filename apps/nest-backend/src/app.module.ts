import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaiterModule } from './waiter/waiter.module';
import { dataBaseConfig } from './database/database.config';
import { SequelizeModule } from '@nestjs/sequelize';
import { EventsGatewayModule } from './events-gateway/events-gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    WaiterModule,
    SequelizeModule.forRoot(dataBaseConfig),
    EventsGatewayModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
