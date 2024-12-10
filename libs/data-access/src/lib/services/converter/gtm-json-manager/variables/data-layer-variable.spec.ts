import { TestBed } from '@angular/core/testing';
import { DataLayerVariable } from './data-layer-variable.service';
import { ParameterUtils } from '../parameter-utils.service';

describe('DataLayerVariable', () => {
  let service: DataLayerVariable;
  let parameterUtils: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataLayerVariable, ParameterUtils]
    });

    service = TestBed.inject(DataLayerVariable);
    parameterUtils = TestBed.inject(ParameterUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createVariable', () => {
    it('should create a variable config correctly', () => {
      const accountId = 'test-account';
      const containerId = 'test-container';
      const dataLayerName = ' testDataLayer ';

      const result = service.createDataLayerVariable(
        accountId,
        containerId,
        dataLayerName
      );

      expect(result).toEqual({
        name: 'DLV - testDataLayer',
        type: 'v',
        accountId: 'test-account',
        containerId: 'test-container',
        parameter: [
          { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
          { type: 'BOOLEAN', key: 'setDefaultValue', value: 'false' },
          { type: 'TEMPLATE', key: 'name', value: 'testDataLayer' }
        ]
      });
    });

    it('should trim the dataLayerName', () => {
      const accountId = 'test-account';
      const containerId = 'test-container';
      const dataLayerName = '  spacedDataLayer  ';

      const result = service.createDataLayerVariable(
        accountId,
        containerId,
        dataLayerName
      );

      expect(result.name).toBe('DLV - spacedDataLayer');
    });
  });
});
