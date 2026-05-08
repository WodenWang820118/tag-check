import { describe, it, expect, vi } from 'vitest';
import { Logger } from '@nestjs/common';
import { LoggingInterceptor, Log } from './logging-interceptor.service';
import { of, throwError, lastValueFrom } from 'rxjs';

describe('Log decorator', () => {
  it('sets log-context metadata on the decorated method', () => {
    class Sample {
      @Log('hello')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async run(_a: number) {
        return 'ok';
      }
    }
    const target = Sample.prototype as unknown as object;
    expect(Reflect.getMetadata('log-context', target, 'run')).toBe(true);
    expect(Reflect.getMetadata('log-message', target, 'run')).toBe('hello');
  });

  it('wraps async methods so they still return their result', async () => {
    class Sample {
      @Log()
      async double(n: number): Promise<number> {
        return n * 2;
      }
    }
    const s = new Sample();
    expect(await s.double(3)).toBe(6);
  });

  it('rethrows errors raised in the wrapped async method', async () => {
    class Sample {
      @Log('boom')
      async fail(): Promise<void> {
        throw new Error('nope');
      }
    }
    const s = new Sample();
    await expect(s.fail()).rejects.toThrow('nope');
  });

  it('passes through synchronous return values', async () => {
    class Sample {
      @Log()
      sync(n: number): number {
        return n + 1;
      }
    }
    expect(await new Sample().sync(2)).toBe(3);
  });
});

describe('LoggingInterceptor', () => {
  function buildContext(opts: { method: string; target: object }) {
    return {
      getClass: () => ({
        name: 'Ctrl',
        prototype: opts.target
      }),
      getHandler: () => ({ name: opts.method })
    } as never;
  }

  it('skips logging when log-context metadata is not set', async () => {
    const logger = {
      log: vi.fn(),
      debug: vi.fn(),
      error: vi.fn()
    } as unknown as Logger;
    const interceptor = new LoggingInterceptor(logger);
    class Ctrl {
      handler() {
        /* noop */
      }
    }
    const ctx = buildContext({ method: 'handler', target: Ctrl.prototype });
    const next = { handle: () => of('value') };

    const result$ = interceptor.intercept(ctx, next as never);
    expect(await lastValueFrom(result$)).toBe('value');
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('logs before and after when log-context is set', async () => {
    const logger = {
      log: vi.fn(),
      debug: vi.fn(),
      error: vi.fn()
    } as unknown as Logger;
    const interceptor = new LoggingInterceptor(logger);
    class Ctrl {
      handler() {
        /* noop */
      }
    }
    Reflect.defineMetadata('log-context', true, Ctrl.prototype, 'handler');
    Reflect.defineMetadata(
      'log-message',
      'doing the thing',
      Ctrl.prototype,
      'handler'
    );
    const ctx = buildContext({ method: 'handler', target: Ctrl.prototype });
    const next = { handle: () => of({ ok: true }) };

    await lastValueFrom(interceptor.intercept(ctx, next as never));
    expect(logger.log).toHaveBeenCalledTimes(2);
    const firstCall = (logger.log as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(firstCall[0]).toBe('doing the thing');
    expect(logger.debug).toHaveBeenCalled();
  });

  it('logs errors emitted by the handler stream', async () => {
    const logger = {
      log: vi.fn(),
      debug: vi.fn(),
      error: vi.fn()
    } as unknown as Logger;
    const interceptor = new LoggingInterceptor(logger);
    class Ctrl {
      handler() {
        /* noop */
      }
    }
    Reflect.defineMetadata('log-context', true, Ctrl.prototype, 'handler');
    const ctx = buildContext({ method: 'handler', target: Ctrl.prototype });
    const next = {
      handle: () => throwError(() => new Error('bad'))
    };

    await expect(
      lastValueFrom(interceptor.intercept(ctx, next as never))
    ).rejects.toThrow('bad');
    expect(logger.error).toHaveBeenCalled();
  });
});
