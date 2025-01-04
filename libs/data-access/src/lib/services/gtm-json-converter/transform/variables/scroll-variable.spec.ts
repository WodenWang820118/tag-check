import { TestBed } from '@angular/core/testing';
import { ScrollVariable } from './scroll-variable.service';
import { VariableConfig } from '@utils';

describe('ScrollVariable', () => {
  let service: ScrollVariable;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ScrollVariable]
    });

    service = TestBed.inject(ScrollVariable);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a scroll built-in variable config correctly', () => {
    const accountId = 'test-account';
    const containerId = 'test-container';

    const result = service.scrollBuiltInVariable({ accountId, containerId });
    const expected: VariableConfig[] = [
      {
        accountId: 'test-account',
        containerId: 'test-container',
        type: 'SCROLL_DEPTH_THRESHOLD',
        name: 'Scroll Depth Threshold'
      }
    ];
    expect(result).toEqual(expected);
  });

  it('should return an array with a single item', () => {
    const result = service.scrollBuiltInVariable({
      accountId: 'any',
      containerId: 'any'
    });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(1);
  });

  it('should use the provided accountId and containerId', () => {
    const accountId = 'custom-account';
    const containerId = 'custom-container';

    const result = service.scrollBuiltInVariable({ accountId, containerId });

    expect(result[0].accountId).toBe('custom-account');
    expect(result[0].containerId).toBe('custom-container');
  });
});
