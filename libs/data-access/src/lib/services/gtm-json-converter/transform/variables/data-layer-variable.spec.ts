import { TestBed } from '@angular/core/testing';
import { DataLayerVariable } from './data-layer-variable.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { VariableConfig } from '@utils';

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
      const dataLayerName = [' testDataLayer '];

      const result = service.createDataLayerVariable(
        accountId,
        containerId,
        dataLayerName
      );
      const expected: VariableConfig[] = [
        {
          name: 'DLV - testDataLayer',
          type: 'v',
          accountId: 'test-account',
          containerId: 'test-container',
          parameter: [
            { type: 'INTEGER', key: 'dataLayerVersion', value: '2' },
            { type: 'BOOLEAN', key: 'setDefaultValue', value: 'false' },
            { type: 'TEMPLATE', key: 'name', value: 'testDataLayer' }
          ]
        }
      ];

      expect(result).toEqual(expected);
    });

    it('should trim the dataLayerName', () => {
      const accountId = 'test-account';
      const containerId = 'test-container';
      const dataLayerName = ['  spacedDataLayer  '];

      const result: VariableConfig[] = service.createDataLayerVariable(
        accountId,
        containerId,
        dataLayerName
      );

      expect(result[0].name).toBe('DLV - spacedDataLayer');
    });
  });
});
