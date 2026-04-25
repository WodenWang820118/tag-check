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
