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

  it('round-trips temp/itemDef/loading signals', () => {
    const itemDef = {
      itemId: 'a',
      templateName: 't',
      fullItemDef: {}
    } as never;
    service.setTempItemDef(itemDef);
    service.setItemDef(itemDef);
    service.setLoading(true);
    expect(service.tempItemDefContent$()).toBe(itemDef);
    expect(service.itemDefContent$()).toBe(itemDef);
    expect(service.isLoading$()).toBe(true);
  });

  it('readItemDefJsonFileContent accepts the full DTO shape', async () => {
    vi.useFakeTimers();
    const dto = {
      templateName: 't',
      itemId: 'i',
      fullItemDef: { foo: 'bar' }
    };
    const file = { text: () => Promise.resolve(JSON.stringify(dto)) } as File;
    service.readItemDefJsonFileContent(file);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.tempItemDefContent$()).toEqual(dto);
    vi.advanceTimersByTime(1000);
    expect(service.isLoading$()).toBe(false);
  });

  it('readItemDefJsonFileContent wraps a bare object in the DTO shape', async () => {
    vi.useFakeTimers();
    const file = {
      text: () => Promise.resolve('{"foo":"bar"}')
    } as File;
    service.readItemDefJsonFileContent(file);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.tempItemDefContent$()).toEqual({
      templateName: '',
      itemId: '',
      fullItemDef: { foo: 'bar' }
    });
    vi.advanceTimersByTime(1000);
  });

  it('readItemDefJsonFileContent sets temp to null on parse error', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const file = { text: () => Promise.resolve('not json') } as File;
    service.tempItemDefContent.set({ itemId: 'old' } as never);
    service.readItemDefJsonFileContent(file);
    await Promise.resolve();
    await Promise.resolve();
    expect(service.tempItemDefContent$()).toBeNull();
    vi.advanceTimersByTime(1000);
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

  it('getItemDefByTemplateName returns null when name is empty', async () => {
    expect(
      await firstValueFrom(service.getItemDefByTemplateName(''))
    ).toBeNull();
    expect(httpClient.get).not.toHaveBeenCalled();
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
