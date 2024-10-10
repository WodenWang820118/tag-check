import { Global, Logger, Module } from '@nestjs/common';
import { LoggingInterceptor } from './logging-interceptor.service';

@Global()
@Module({
  providers: [LoggingInterceptor, Logger],
  exports: [LoggingInterceptor, Logger],
})
export class LoggingInterceptorModule {}
