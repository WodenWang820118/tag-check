import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import type { GTMConfiguration } from '@utils';
import { GtmJsonParserService } from './gtm-json-parser.service';

describe('GtmJsonParserService', () => {
  let service: GtmJsonParserService;
  let httpClient: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpClient = { post: vi.fn() };
    service = new GtmJsonParserService(httpClient as unknown as HttpClient);
  });

  it('throws with the reason when JSON is not a container export', () => {
    expect(() => service.parseGtmJson('{"foo":"bar"}')).toThrow(
      'The file is not a Tag Manager container export: containerVersion is missing.'
    );
  });

  it('throws on syntactically invalid JSON', () => {
    expect(() => service.parseGtmJson('not json')).toThrow(
      'The file is not valid JSON.'
    );
  });

  it('accepts an export that leaves out lists the container does not use', () => {
    const parsed = service.parseGtmJson(
      JSON.stringify({
        exportFormatVersion: 2,
        exportTime: 'now',
        containerVersion: { tag: [] }
      })
    );
    expect(parsed.containerVersion.variable).toEqual([]);
  });

  it('returns parsed configuration when JSON satisfies the GTM type guard', () => {
    const config = {
      exportFormatVersion: 2,
      exportTime: 'now',
      containerVersion: {
        container: {},
        folder: [],
        builtInVariable: [],
        variable: [],
        trigger: [],
        tag: []
      }
    };
    expect(service.parseGtmJson(JSON.stringify(config))).toEqual(config);
  });

  it('uploads GTM JSON to the project-scoped endpoint', () => {
    const obs = of({});
    httpClient.post.mockReturnValue(obs);
    const payload = { foo: 'bar' } as unknown as GTMConfiguration;
    expect(service.uploadGtmJson('shop', payload)).toBe(obs);
    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/upload/shop'),
      payload
    );
  });
});
