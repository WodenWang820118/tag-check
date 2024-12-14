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
});
