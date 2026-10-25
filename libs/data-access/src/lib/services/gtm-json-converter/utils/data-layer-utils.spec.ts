import { TestBed } from '@angular/core/testing';
import { isStrictDataLayerEvent, type StrictDataLayerEvent } from '@utils';
import { DataLayerUtils } from './data-layer-utils.service';

describe('DataLayerManager', () => {
  let service: DataLayerUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataLayerUtils]
    });
    service = TestBed.inject(DataLayerUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should return self-defined data layers', () => {
    const specs = [
      {
        event: 'select_promotion',
        ecommerce: {
          creative_name: '$creative_name',
          creative_slot: '$creative_slot',
          promotion_id: '$promotion_id',
          promotion_name: '$promotion_name',
          items: [
            {
              item_id: '$item_id',
              item_name: '$item_name'
            }
          ]
        }
      }
    ];
    const dataLayers = service.getDataLayers(specs);
    expect(dataLayers).toEqual([
      {
        event: 'select_promotion',
        paths: [
          'ecommerce.creative_name',
          'ecommerce.creative_slot',
          'ecommerce.promotion_id',
          'ecommerce.promotion_name',
          'ecommerce.items'
        ]
      }
    ]);
  });

  it('should leave out the keys of every item, not only the first', () => {
    const dataLayers = service.getDataLayers([
      {
        event: 'purchase',
        ecommerce: {
          value: 10,
          items: [{ item_id: '$item_id' }, { item_id: '$item_id' }]
        }
      }
    ]);

    expect(dataLayers).toEqual([
      { event: 'purchase', paths: ['ecommerce.value', 'ecommerce.items'] }
    ]);
  });

  describe('nested objects', () => {
    // Specs are parsed from the JSON the user types, which may nest any
    // object, while StrictDataLayerEvent only types `ecommerce` objects.
    function toSpec(value: unknown): StrictDataLayerEvent {
      if (!isStrictDataLayerEvent(value)) {
        throw new Error('expected a dataLayer spec');
      }
      return value;
    }

    it('keeps the keys of a nested object and leaves out the object', () => {
      const dataLayers = service.getDataLayers([
        toSpec({ event: 'login', user: { id: '$id', type: '$type' } })
      ]);

      expect(dataLayers).toEqual([
        { event: 'login', paths: ['user.id', 'user.type'] }
      ]);
    });

    it('keeps only the leaves of a two-level nested object', () => {
      const dataLayers = service.getDataLayers([
        toSpec({
          event: 'login',
          method: '$method',
          user: { id: '$id', address: { city: '$city', country: '$country' } }
        })
      ]);

      expect(dataLayers).toEqual([
        {
          event: 'login',
          paths: [
            'method',
            'user.id',
            'user.address.city',
            'user.address.country'
          ]
        }
      ]);
    });

    it('keeps a key that one spec pushes as a value and another as an object', () => {
      const dataLayers = service.getDataLayers([
        toSpec({ event: 'login', user: { id: '$id' } }),
        toSpec({ event: 'login', user: '$user' })
      ]);

      expect(dataLayers).toEqual([
        { event: 'login', paths: ['user.id', 'user'] }
      ]);
    });

    it('leaves the ecommerce paths unchanged', () => {
      const dataLayers = service.getDataLayers([
        {
          event: 'add_to_cart',
          ecommerce: { currency: '$currency', value: 10 }
        }
      ]);

      expect(dataLayers).toEqual([
        {
          event: 'add_to_cart',
          paths: ['ecommerce.currency', 'ecommerce.value']
        }
      ]);
    });

    it('keeps items as one path, whatever its entries hold', () => {
      const dataLayers = service.getDataLayers([
        toSpec({
          event: 'view_item',
          ecommerce: {
            items: [{ item_id: '$item_id', item_category: { name: '$c' } }]
          },
          products: [{ id: '$id' }]
        })
      ]);

      expect(dataLayers).toEqual([
        { event: 'view_item', paths: ['ecommerce.items', 'products'] }
      ]);
    });
  });

  it('should merge specs that repeat an event into one entry', () => {
    const dataLayers = service.getDataLayers([
      { event: 'login', method: '$method' },
      { event: 'sign_up', method: '$method' },
      { event: 'login', user_type: '$user_type' }
    ]);

    expect(dataLayers).toEqual([
      { event: 'login', paths: ['method', 'user_type'] },
      { event: 'sign_up', paths: ['method'] }
    ]);
  });
});
