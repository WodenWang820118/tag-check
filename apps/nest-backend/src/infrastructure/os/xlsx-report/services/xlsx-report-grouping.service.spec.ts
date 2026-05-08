import { describe, expect, it } from 'vitest';
import { XlsxReportGroupingService } from './xlsx-report-grouping.service';

describe('XlsxReportGroupingService', () => {
  const service = new XlsxReportGroupingService();

  function makeReport(overrides: Record<string, unknown> = {}) {
    return {
      project: {
        projectName: 'P1',
        projectSlug: 'p1',
        projectDescription: 'desc',
        measurementId: 'G-1',
        ...overrides
      }
    } as never;
  }

  it('extractProjectInfo returns the project metadata fields verbatim', () => {
    expect(service.extractProjectInfo(makeReport())).toEqual({
      projectName: 'P1',
      projectSlug: 'p1',
      projectDescription: 'desc',
      measurementId: 'G-1'
    });
  });

  it('extractProjectInfo applies fallback labels for missing fields', () => {
    const report = {
      project: {
        projectName: '',
        projectSlug: '',
        projectDescription: '',
        measurementId: ''
      }
    } as never;
    expect(service.extractProjectInfo(report)).toEqual({
      projectName: 'Unknown Project',
      projectSlug: 'unknown-project',
      projectDescription: 'No description available',
      measurementId: 'No measurement ID'
    });
  });

  it('groupReportsByProject buckets reports by "<projectName>-<projectSlug>"', () => {
    const a1 = makeReport();
    const a2 = makeReport();
    const b1 = makeReport({ projectName: 'P2', projectSlug: 'p2' });
    const groups = service.groupReportsByProject([a1, b1, a2]);
    expect(Object.keys(groups).sort()).toEqual(['P1-p1', 'P2-p2']);
    expect(groups['P1-p1']).toHaveLength(2);
    expect(groups['P2-p2']).toHaveLength(1);
  });
});
