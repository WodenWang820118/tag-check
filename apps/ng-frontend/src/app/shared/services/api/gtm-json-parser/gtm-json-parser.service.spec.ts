import { HttpClient } from '@angular/common/http';
import { of } from 'rxjs';
import { GtmJsonParserService } from './gtm-json-parser.service';

describe('GtmJsonParserService', () => {
  let service: GtmJsonParserService;
  let httpClient: { post: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    httpClient = { post: vi.fn() };
    service = new GtmJsonParserService(httpClient as unknown as HttpClient);
  });

  it('throws when JSON is not a GTM configuration', () => {
    expect(() => service.parseGtmJson('{"foo":"bar"}')).toThrow(
      'Invalid GTM configuration JSON.'
    );
  });

  it('throws on syntactically invalid JSON', () => {
    expect(() => service.parseGtmJson('not json')).toThrow();
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
    const payload = { foo: 'bar' } as any;
    expect(service.uploadGtmJson('shop', payload)).toBe(obs);
    expect(httpClient.post).toHaveBeenCalledWith(
      expect.stringContaining('/upload/shop'),
      payload
    );
  });
});
