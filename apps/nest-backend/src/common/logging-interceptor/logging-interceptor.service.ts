// Removed: @Log() decorator and LoggingInterceptor.
// Structured JSON logging is now handled by nestjs-pino LoggerModule + pino-http middleware
// configured in app.module.ts, with LoggerErrorInterceptor as the global APP_INTERCEPTOR.
// Call sites that used @Log() have had the decorator removed; HTTP request completion
// logging is emitted automatically by pino-http with req.id / method / url / statusCode / responseTime.
