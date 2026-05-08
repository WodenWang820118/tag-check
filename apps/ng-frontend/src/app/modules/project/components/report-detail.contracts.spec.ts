import { toTagSpec } from './report-detail.contracts';

describe('toTagSpec', () => {
  it('returns undefined for an undefined spec', () => {
    expect(toTagSpec(undefined)).toBeUndefined();
  });

  it('promotes the inner dataLayerSpec.event to the top-level event field', () => {
    const spec = {
      dataLayerSpec: { event: 'page_view', extra: 'x' },
      otherKey: 'k'
    } as any;
    const result = toTagSpec(spec) as any;
    expect(result.event).toBe('page_view');
    expect(result.dataLayerSpec).toBe(spec.dataLayerSpec);
    expect(result.otherKey).toBe('k');
  });
});
