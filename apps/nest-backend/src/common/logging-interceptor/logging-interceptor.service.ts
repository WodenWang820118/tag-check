/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export function Log(message?: string): MethodDecorator {
  return function (
    target: object,
    propertyKey: string | symbol,
    descriptor: PropertyDescriptor
  ) {
    // Set metadata to be used by interceptor (for controllers)
    Reflect.defineMetadata('log-context', true, target, propertyKey);
    if (message) {
      Reflect.defineMetadata('log-message', message, target, propertyKey);
    }

    // Wrap the method to perform logging directly (for services)
    const originalMethod = descriptor.value;
    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      const methodName = String(propertyKey);
      const logContext = `${className}.${methodName}`;

      const logMessage = message || 'Method called';
      Logger.log(`${logMessage}`, logContext);
      const start = Date.now();

      let result;
      try {
        result = originalMethod.apply(this, args);

        if (result && typeof result.then === 'function') {
          // Method returns a Promise (is asynchronous)
          try {
            const res = await result;
            const elapsed = Date.now() - start;
            Logger.log(`${logMessage} - Completed in ${elapsed}ms`, logContext);
            if (res) {
              Logger.debug(
                `Result: ${JSON.stringify(res, null, 2)}`,
                logContext
              );
            }
            return res;
          } catch (error) {
            Logger.error(
              `${(error as Error).message}`,
              (error as Error).stack,
              logContext
            );
            throw error;
          }
        } else {
          // Method is synchronous
          const elapsed = Date.now() - start;
          Logger.log(`${logMessage} - Completed in ${elapsed}ms`, logContext);
          if (result) {
            Logger.debug(
              `Result: ${JSON.stringify(result, null, 2)}`,
              logContext
            );
          }
          return result;
        }
      } catch (error) {
        Logger.error(
          (error as Error).message,
          (error as Error).stack,
          logContext
        );
        throw error;
      }
    };
    return descriptor;
  };
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: Logger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const className = context.getClass().name;
    const methodName = context.getHandler().name;

    const target = context.getClass().prototype;
    const isLoggingEnabled = Reflect.getMetadata(
      'log-context',
      target,
      methodName
    );

    if (isLoggingEnabled) {
      const logContext = `${className}.${methodName}`;
      const customMessage =
        Reflect.getMetadata('log-message', target, methodName) ||
        'Method called';

      // Log before method execution
      this.logger.log(customMessage, logContext);

      const now = Date.now();

      return next.handle().pipe(
        tap({
          next: (data) => {
            // Log after successful method execution
            const elapsedTime = Date.now() - now;
            this.logger.log(
              `${customMessage} - Completed in ${elapsedTime}ms`,
              logContext
            );
            if (data) {
              this.logger.debug(
                `Result: ${JSON.stringify(data, null, 2)}`,
                logContext
              );
            }
          },
          error: (error) => {
            // Log error
            this.logger.error(`${error.message}, ${error.stack}`, logContext);
          }
        })
      );
    }

    return next.handle();
  }
}
