import { describe, expect, it } from 'vitest';
import { ReportDetailsDto } from './report-details.dto';

describe('ReportDetailsDto', () => {
  it('initializes default fields when given an empty payload', () => {
    const dto = new ReportDetailsDto({});
    expect(dto.position).toBe(0);
    expect(dto.passed).toBe(false);
    expect(dto.requestPassed).toBe(false);
    expect(dto.dataLayer).toEqual([]);
    expect(dto.dataLayerSpec).toEqual({});
    expect(dto.rawRequest).toBe('');
    expect(dto.message).toBe('');
    expect(dto.destinationUrl).toBe('');
    expect(dto.completedTime).toBeInstanceOf(Date);
    expect(dto.createdAt).toBeInstanceOf(Date);
  });

  it('overrides defaults with values from the partial payload via Object.assign', () => {
    const dto = new ReportDetailsDto({
      position: 7,
      eventId: 'evt-1',
      testName: 't',
      eventName: 'page_view',
      passed: true,
      requestPassed: true,
      message: 'ok'
    });
    expect(dto.position).toBe(7);
    expect(dto.eventId).toBe('evt-1');
    expect(dto.eventName).toBe('page_view');
    expect(dto.passed).toBe(true);
    expect(dto.requestPassed).toBe(true);
    expect(dto.message).toBe('ok');
  });
});
