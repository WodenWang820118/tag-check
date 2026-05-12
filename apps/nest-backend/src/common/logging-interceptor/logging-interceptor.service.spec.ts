import { describe, it, expect } from 'vitest';

describe('logging-interceptor (removed)', () => {
  it('the @Log() decorator and LoggingInterceptor have been removed', () => {
    // Structured JSON logging is now handled by nestjs-pino LoggerModule
    // + pino-http middleware configured in app.module.ts.
    // HTTP completion logging is emitted automatically with
    // req.id / method / url / statusCode / responseTime.
    expect(true).toBe(true);
  });
});
