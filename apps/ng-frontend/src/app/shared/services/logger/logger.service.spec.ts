import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LogLevel, LoggerService } from './logger.service';

describe('LoggerService', () => {
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let logSpy: ReturnType<typeof vi.spyOn>;
  let service: LoggerService;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => undefined);
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    infoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    service = new LoggerService();
    vi.clearAllMocks();
  });

  it('logs contextual info messages through the matching console method', () => {
    service.setConfig({ enableTimestamp: false });

    service.info('Saved project', 'api', { projectSlug: 'demo-project' });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    expect(infoSpy.mock.calls[0]).toContain('Saved project');
    expect(infoSpy.mock.calls[0]).toContain('API');
    expect(infoSpy.mock.calls[0][5]).toEqual({ projectSlug: 'demo-project' });
  });

  it('suppresses logs below the configured log level', () => {
    service.setConfig({
      enableTimestamp: false,
      level: LogLevel.ERROR
    });

    service.info('This should not be logged');
    service.warn('This should also stay hidden');

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('logs error messages and stack traces for Error instances', () => {
    service.setConfig({ enableTimestamp: false });

    const error = new Error('Navigation failed');
    Object.defineProperty(error, 'stack', {
      configurable: true,
      value: 'stack-trace'
    });

    service.error(error, 'router');

    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(errorSpy.mock.calls[0]).toContain('ROUTER');
    expect(errorSpy.mock.calls[0]).toContain('Navigation failed');
    expect(errorSpy.mock.calls[1][0]).toBe('stack-trace');
  });

  it('logs Error instances consistently at warn level', () => {
    service.setConfig({ enableTimestamp: false });

    const error = new Error('Delayed warning');
    Object.defineProperty(error, 'stack', {
      configurable: true,
      value: 'warn-stack'
    });

    service.warn(error, 'router');

    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[0]).toContain('ROUTER');
    expect(warnSpy.mock.calls[0]).toContain('Delayed warning');
    expect(warnSpy.mock.calls[1][0]).toBe('warn-stack');
  });
});
