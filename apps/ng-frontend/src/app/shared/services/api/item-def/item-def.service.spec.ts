import { HttpClient } from '@angular/common/http';
import { firstValueFrom, of, throwError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { ItemDefService } from './item-def.service';

describe('ItemDefService', () => {
  let httpClient: {
    get: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>;
  };
  let service: ItemDefService;

  beforeEach(() => {
    httpClient = { get: vi.fn(), put: vi.fn() };
    service = new ItemDefService(httpClient as unknown as HttpClient);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('getItemDefById short-circuits when no id is provided', async () => {
    await expect(firstValueFrom(service.getItemDefById(''))).rejects.toThrow(
      'itemId is required'
    );
    expect(httpClient.get).not.toHaveBeenCalled();
  });

  it('getItemDefById encodes the id and rethrows wrapped errors', async () => {
    httpClient.get.mockReturnValueOnce(of({ itemId: 'a/b' } as never));
    await firstValueFrom(service.getItemDefById('a/b'));
    expect(httpClient.get).toHaveBeenCalledWith(
      `${environment.specApiUrl}/${encodeURIComponent('a/b')}/item-def`
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.get.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(firstValueFrom(service.getItemDefById('a'))).rejects.toThrow(
      'Failed to get item definition'
    );
  });

  it('updateItemDef PUTs the body and short-circuits without an id', async () => {
    httpClient.put.mockReturnValueOnce(of({ itemId: 'a' } as never));
    await firstValueFrom(service.updateItemDef('a', { templateName: 't' }));
    expect(httpClient.put).toHaveBeenCalledWith(
      `${environment.specApiUrl}/a/item-def`,
      { templateName: 't' }
    );
    await expect(firstValueFrom(service.updateItemDef('', {}))).rejects.toThrow(
      'itemId is required to update item definition'
    );
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    httpClient.put.mockReturnValueOnce(throwError(() => new Error('x')));
    await expect(
      firstValueFrom(service.updateItemDef('a', {}))
    ).rejects.toThrow('Failed to update item definition');
  });
});
