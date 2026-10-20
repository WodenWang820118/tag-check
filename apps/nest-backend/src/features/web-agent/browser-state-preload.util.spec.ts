import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import {
  localStorageScript,
  seedSiteLocalStorage
} from './browser-state-preload.util';
import type { EventInspectionPresetDto } from '../../shared/dto/event-inspection-preset.dto';

// Values may be non-strings on purpose: the script stringifies them.
function preset(
  data: Array<{ key: string; value: unknown }>
): EventInspectionPresetDto['application'] {
  return {
    localStorage: { data },
    cookie: { data: [] }
  } as EventInspectionPresetDto['application'];
}

describe('localStorageScript', () => {
  it('runs with nothing but localStorage in scope', () => {
    // The page has none of the bundle's helpers, so the script must be
    // self-contained.
    const stored = new Map<string, string>();
    const script = localStorageScript(
      preset([
        { key: 'consent', value: 'true' },
        { key: 'consentPreferences', value: { analytics_storage: true } },
        { key: 'visits', value: 3 }
      ])
    );

    runInNewContext(script as string, {
      localStorage: {
        setItem: (key: string, value: string) => stored.set(key, value)
      }
    });

    expect(Object.fromEntries(stored)).toEqual({
      consent: 'true',
      consentPreferences: '{"analytics_storage":true}',
      visits: '3'
    });
  });

  it('returns null when the preset has no localStorage', () => {
    expect(localStorageScript(preset([]))).toBeNull();
  });
});

describe('seedSiteLocalStorage', () => {
  it('writes the preset into the site origin from an empty, intercepted document', async () => {
    const calls: string[] = [];
    let onRequest: ((request: unknown) => void) | undefined;
    const seedPage = {
      setRequestInterception: vi.fn(async () => {
        calls.push('intercept');
      }),
      on: vi.fn((event: string, handler: (request: unknown) => void) => {
        if (event === 'request') onRequest = handler;
      }),
      goto: vi.fn(async () => {
        calls.push('goto');
      }),
      evaluate: vi.fn(async () => {
        calls.push('evaluate');
      }),
      close: vi.fn(async () => {
        calls.push('close');
      })
    };
    const browser = { newPage: vi.fn().mockResolvedValue(seedPage) };

    await seedSiteLocalStorage(
      browser as never,
      'https://example.test/product?gtm_debug=1',
      preset([{ key: 'consent', value: 'true' }])
    );

    expect(calls).toEqual(['intercept', 'goto', 'evaluate', 'close']);
    expect(seedPage.goto).toHaveBeenCalledWith('https://example.test');
    expect(seedPage.evaluate).toHaveBeenCalledWith(
      expect.stringContaining('"consent"')
    );
    const respond = vi.fn().mockResolvedValue(undefined);
    onRequest?.({ respond });
    expect(respond).toHaveBeenCalledWith(
      expect.objectContaining({ status: 200, contentType: 'text/html' })
    );
  });

  it('closes the seed page when writing fails', async () => {
    const seedPage = {
      setRequestInterception: vi.fn().mockResolvedValue(undefined),
      on: vi.fn(),
      goto: vi.fn().mockRejectedValue(new Error('net::ERR_FAILED')),
      evaluate: vi.fn(),
      close: vi.fn().mockResolvedValue(undefined)
    };
    const browser = { newPage: vi.fn().mockResolvedValue(seedPage) };

    await expect(
      seedSiteLocalStorage(
        browser as never,
        'https://example.test',
        preset([{ key: 'consent', value: 'true' }])
      )
    ).rejects.toThrow('net::ERR_FAILED');
    expect(seedPage.close).toHaveBeenCalledTimes(1);
  });

  it('opens no page when the preset has no localStorage', async () => {
    const browser = { newPage: vi.fn() };

    await seedSiteLocalStorage(
      browser as never,
      'https://example.test',
      preset([])
    );

    expect(browser.newPage).not.toHaveBeenCalled();
  });
});
