import { toTagSpec, getRunStatus } from './report-detail.contracts';

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

describe('getRunStatus', () => {
  const created = new Date('2026-10-20T01:00:00.000Z');
  const later = new Date('2026-10-20T01:05:00.000Z');
  const report = (passed: boolean, requestPassed: boolean, updatedAt = later) =>
    ({ createdAt: created, updatedAt, passed, requestPassed }) as never;

  it('is notRun until the detail is updated after it was created', () => {
    expect(getRunStatus(report(false, false, created))).toBe('notRun');
    expect(getRunStatus(undefined)).toBe('notRun');
  });

  it('is passed, partial or failed from the two checks after a run', () => {
    expect(getRunStatus(report(true, true))).toBe('passed');
    expect(getRunStatus(report(true, false))).toBe('partial');
    expect(getRunStatus(report(false, true))).toBe('partial');
    expect(getRunStatus(report(false, false))).toBe('failed');
  });
});
