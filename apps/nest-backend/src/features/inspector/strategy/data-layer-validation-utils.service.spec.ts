import { describe, expect, it } from 'vitest';
import { DataLayerValidationUtilsService } from './data-layer-validation-utils.service';

describe('DataLayerValidationUtilsService', () => {
  const service = new DataLayerValidationUtilsService();

  it('passes when all keys match exactly', () => {
    const spec = { event: 'page_view', page: '/home' } as never;
    const obj = { event: 'page_view', page: '/home' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(true);
    expect(result.message).toBe('Valid');
  });

  it('fails with a missing-key message when a spec key is absent on the event', () => {
    const spec = { event: 'page_view', page: '/home' } as never;
    const obj = { event: 'page_view' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('Key "page" is missing');
  });

  it('treats $-prefixed string spec values as a wildcard match', () => {
    const spec = { event: 'page_view', user_id: '$any' } as never;
    const obj = { event: 'page_view', user_id: 'whatever' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(true);
  });

  it('matches /pattern/ as a regex against string event values', () => {
    const spec = { event: 'page_view', page: '/^\\/home/' } as never;
    const okObj = { event: 'page_view', page: '/home/index' } as never;
    const badObj = { event: 'page_view', page: '/about' } as never;
    expect(service.validateKeyValues(spec, okObj).passed).toBe(true);
    const failed = service.validateKeyValues(spec, badObj);
    expect(failed.passed).toBe(false);
    expect(failed.message).toContain('does not match the regex pattern');
  });

  it('fails when a regex-spec value is compared against a non-string event value', () => {
    const spec = { event: 'page_view', count: '/^\\d+$/' } as never;
    const obj = { event: 'page_view', count: 5 } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(false);
    expect(result.message).toContain('is not a string');
  });

  it('passes for matching numeric spec values and fails when they differ', () => {
    const spec = { event: 'purchase', value: 10 } as never;
    expect(
      service.validateKeyValues(spec, { event: 'purchase', value: 10 } as never)
        .passed
    ).toBe(true);
    expect(
      service.validateKeyValues(spec, { event: 'purchase', value: 11 } as never)
        .passed
    ).toBe(false);
  });

  it('fails when a literal string spec value does not match the event value', () => {
    const spec = { event: 'page_view', page: '/home' } as never;
    const obj = { event: 'page_view', page: '/about' } as never;
    const result = service.validateKeyValues(spec, obj);
    expect(result.passed).toBe(false);
    expect(result.message).toContain(
      'Value for key "page" does not match the expected value'
    );
  });
});
