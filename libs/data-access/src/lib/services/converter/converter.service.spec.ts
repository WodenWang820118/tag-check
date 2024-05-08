import { TestBed } from '@angular/core/testing';
import { ConverterService } from './converter.service';

describe('ConverterService', () => {
  let service: ConverterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConverterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should add a new data layer', () => {
    service.addDataLayer(['a', 'b.c', 'd.e.f']);
    expect(service.dataLayers).toEqual(['a', 'b.c', 'd.e.f']);
  });

  it('should filter duplicates', () => {
    const paths = ['a', 'b.c', 'd.e.f', 'a.d', 'b.c.d.e.f'];
    const dataLayers = ['a', 'b.c', 'd.e.f', 'a', 'a.d'];
    const filtered = service.filterDuplicates(paths, dataLayers);
    expect(filtered).toEqual(['b.c.d.e.f']);
  });

  it('should add a new tag if it does not exist', () => {
    service.addTagIfNotExists('newEvent', []);
    expect(service.tags).toContainEqual({
      name: 'newEvent',
      parameters: [],
      triggers: [],
    });
  });

  it('should add a new trigger if it does not exist', () => {
    service.addTriggerIfNotExists('newTrigger');
    expect(service.triggers).toContainEqual({
      name: 'newTrigger',
      triggerId: '1',
    });
  });

  it('should set MeasurementIdCustomJSVariable', () => {
    service.setMeasurementIdCustomJSVariable({
      stagingMeasurementId: 'stagingId',
      stagingUrl: 'stagingUrl',
      productionMeasurementId: 'prodId',
      productionUrl: 'prodUrl',
    });

    expect(service.measurementIdCustomJS).toContain(
      "MEASUREMENT_ID_STAGING = 'stagingId'"
    );
    expect(service.measurementIdCustomJS).toContain(
      "MEASUREMENT_ID_PROD = 'prodId'"
    );
  });
});
