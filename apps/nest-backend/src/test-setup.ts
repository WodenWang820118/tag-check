import { Logger } from '@nestjs/common';
import { afterEach, beforeEach, vi } from 'vitest';

const verboseTestLogs = process.env['TEST_LOGS'] === '1';

if (!verboseTestLogs) {
  const silence = () => undefined;
  const loggerMethods = ['log', 'warn', 'debug', 'verbose', 'error', 'fatal'];
  const consoleMethods = ['log', 'info', 'debug'] as const;
  const loggerPrototype = Logger.prototype as unknown as Record<
    string,
    (...args: unknown[]) => void
  >;
  const loggerConstructor = Logger as unknown as Record<
    string,
    (...args: unknown[]) => void
  >;

  const silenceTestLogs = () => {
    // Disable NestJS built-in logger. In production the backend is
    // nestjs-pino NativeLogger (wired via app.useLogger in main.ts),
    // but unit tests use Test.createTestingModule without LoggerModule
    // so the built-in Logger is what matters here.
    Logger.overrideLogger(false);

    for (const method of loggerMethods) {
      if (typeof loggerPrototype[method] === 'function') {
        vi.spyOn(loggerPrototype, method).mockImplementation(silence);
      }

      if (typeof loggerConstructor[method] === 'function') {
        vi.spyOn(loggerConstructor, method).mockImplementation(silence);
      }
    }

    for (const method of consoleMethods) {
      vi.spyOn(console, method).mockImplementation(silence);
    }
  };

  silenceTestLogs();

  beforeEach(() => {
    silenceTestLogs();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
}
