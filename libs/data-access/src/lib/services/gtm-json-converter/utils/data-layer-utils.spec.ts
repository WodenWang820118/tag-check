import { TestBed } from '@angular/core/testing';
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
