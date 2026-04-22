import { TestBed } from '@angular/core/testing';
import { SpecExtractService } from './spec-extract.service';
import { vi } from 'vitest';

describe('SpecExtractService', () => {
  let service: SpecExtractService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SpecExtractService]
    });
    service = TestBed.inject(SpecExtractService);
  });

  it('normalizes a single event object into an array', () => {
    expect(service.preprocessInput('{ "event": "page_view" }')).toEqual([
      { event: 'page_view' }
    ]);
  });

  it('passes through a valid multi-event array', () => {
    expect(
      service.preprocessInput(
        '[{ "event": "page_view" }, { "event": "purchase", "value": "799" }]'
      )
    ).toEqual([{ event: 'page_view' }, { event: 'purchase', value: '799' }]);
  });

  it('repairs lightly malformed JSON input before parsing', () => {
    expect(service.preprocessInput('[{ event: page_view }]')).toEqual([
      { event: 'page_view' }
    ]);
  });

  it('repairs comments and trailing commas before parsing', () => {
    expect(
      service.preprocessInput(`[
        /* comment */
        {
          event: page_view, // tracking
        },
      ]`)
    ).toEqual([{ event: 'page_view' }]);
  });

  it('throws when semantically invalid JSON cannot be normalized into event objects', () => {
    expect(() =>
      service.preprocessInput('[{ "name": "missing event" }]')
    ).toThrow('Error parsing spec JSON. Please check the format.');
  });

  it('does not attempt JSON repair when valid JSON fails schema normalization', () => {
    const repairSpy = vi.spyOn(service, 'fixJsonString');

    expect(() =>
      service.preprocessInput('[{ "name": "missing event" }]')
    ).toThrow('Error parsing spec JSON. Please check the format.');
    expect(repairSpy).not.toHaveBeenCalled();
  });

  it('throws when repaired JSON still fails event normalization', () => {
    const repairSpy = vi.spyOn(service, 'fixJsonString');

    expect(() =>
      service.preprocessInput("[{ 'name': 'missing event' }]")
    ).toThrow('Error parsing spec JSON. Please check the format.');
    expect(repairSpy).toHaveBeenCalledTimes(1);
  });

  it('throws when the input cannot be repaired into valid JSON', () => {
    expect(() => service.preprocessInput('}}garbage{{')).toThrow(
      'Error parsing spec JSON. Please check the format.'
    );
  });

  it('leaves already valid JSON unchanged when applying repair helpers', () => {
    const input = '[{ "event": "page_view" }]';

    expect(service.fixJsonString(input)).toBe(input);
  });

  it('preserves apostrophes inside already double-quoted strings', () => {
    const input = '{ "message": "It\'s working" }';

    expect(service.fixJsonString(input)).toBe(input);
  });

  it('documents that standalone line comments are not repaired', () => {
    expect(() =>
      service.preprocessInput(`[
          // unsupported standalone comment
          { "event": "page_view" }
        ]`)
    ).toThrow('Error parsing spec JSON. Please check the format.');
  });
});
