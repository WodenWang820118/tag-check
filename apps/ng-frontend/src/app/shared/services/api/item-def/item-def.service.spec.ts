import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { ItemDef } from '@utils';
import { environment } from '../../../../../environments/environment';
import { ItemDefService } from './item-def.service';

/** What GET and PUT /specs/:projectSlug/:eventId/item-def return. */
const itemDefJson: ItemDef = JSON.parse(`{
  "itemId": "add_to_cart",
  "templateName": "Add to cart Info Items",
  "fullItemDef": { "item_id": "city001", "item_name": "Switzerland", "price": 799 }
}`);

describe('ItemDefService', () => {
  let service: ItemDefService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(ItemDefService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    vi.restoreAllMocks();
  });

  it("getItemDef reads the test's definition by project and eventId", async () => {
    const result = firstValueFrom(
      service.getItemDef('my_shop', 'add_to_cart_1')
    );
    const req = httpMock.expectOne(
      `${environment.specApiUrl}/my_shop/add_to_cart_1/item-def`
    );
    expect(req.request.method).toBe('GET');
    req.flush(itemDefJson);

    await expect(result).resolves.toEqual({
      itemId: 'add_to_cart',
      templateName: 'Add to cart Info Items',
      fullItemDef: { item_id: 'city001', item_name: 'Switzerland', price: 799 }
    });
  });

  it('getItemDef resolves null when the test has no definition', async () => {
    const result = firstValueFrom(service.getItemDef('my_shop', 'atc'));
    httpMock
      .expectOne(`${environment.specApiUrl}/my_shop/atc/item-def`)
      .flush(null);

    await expect(result).resolves.toBeNull();
  });

  it('getItemDef encodes both route parameters', async () => {
    const result = firstValueFrom(service.getItemDef('a/b', 'c d'));
    httpMock
      .expectOne(`${environment.specApiUrl}/a%2Fb/c%20d/item-def`)
      .flush(itemDefJson);
    await result;
  });

  it('getItemDef short-circuits without a project or eventId', async () => {
    await expect(firstValueFrom(service.getItemDef('', 'atc'))).rejects.toThrow(
      'projectSlug and eventId are required'
    );
    await expect(
      firstValueFrom(service.getItemDef('my_shop', ''))
    ).rejects.toThrow('projectSlug and eventId are required');
    httpMock.expectNone(() => true);
  });

  it('getItemDef wraps HTTP errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = firstValueFrom(service.getItemDef('my_shop', 'atc'));
    httpMock
      .expectOne(`${environment.specApiUrl}/my_shop/atc/item-def`)
      .flush('boom', { status: 500, statusText: 'Server Error' });

    await expect(result).rejects.toThrow('Failed to get item definition');
  });

  it("updateItemDef PUTs the body to the test's route", async () => {
    const body = {
      itemId: 'add_to_cart',
      templateName: 'Add to cart Info Items',
      fullItemDef: { item_id: 'city001' }
    };
    const result = firstValueFrom(
      service.updateItemDef('my_shop', 'add_to_cart_1', body)
    );
    const req = httpMock.expectOne(
      `${environment.specApiUrl}/my_shop/add_to_cart_1/item-def`
    );
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(body);
    req.flush(itemDefJson);

    await expect(result).resolves.toMatchObject({ itemId: 'add_to_cart' });
  });

  it('updateItemDef short-circuits without a project or eventId', async () => {
    await expect(
      firstValueFrom(service.updateItemDef('my_shop', '', {}))
    ).rejects.toThrow(
      'projectSlug and eventId are required to update item definition'
    );
    httpMock.expectNone(() => true);
  });

  it('updateItemDef wraps HTTP errors, such as 404 for a missing test', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const result = firstValueFrom(service.updateItemDef('my_shop', 'atc', {}));
    httpMock
      .expectOne(`${environment.specApiUrl}/my_shop/atc/item-def`)
      .flush(
        { statusCode: 404, message: 'Test not found' },
        { status: 404, statusText: 'Not Found' }
      );

    await expect(result).rejects.toThrow('Failed to update item definition');
  });
});
