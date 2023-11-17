import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WaiterModule } from './waiter/waiter.module';
import { GcsMonitorModule } from './gcs-monitor/gcs-monitor.module';

@Module({
  imports: [ConfigModule.forRoot(), WaiterModule, GcsMonitorModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
