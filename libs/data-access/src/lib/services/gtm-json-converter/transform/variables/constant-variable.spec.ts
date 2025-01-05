import { TestBed } from '@angular/core/testing';
import { ConstantVariable } from './constant-variable.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { ConstantVariableConfig, VariableTypeEnum } from '@utils';

describe('ConstantVariable', () => {
  let service: ConstantVariable;
  let parameterUtils: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ConstantVariable, ParameterUtils]
    });

    service = TestBed.inject(ConstantVariable);
    parameterUtils = TestBed.inject(ParameterUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createMeasurementIdConstantVariable', () => {
    it('should create a measurement ID constant variable correctly with provided ID', () => {
      // Arrange
      const accountId = 'test-account';
      const containerId = 'test-container';
      const measurementId = 'G-TEST123';

      // Act
      const result = service.createMeasurementIdConstantVariable(
        accountId,
        containerId,
        measurementId
      );

      // Assert
      const expected: ConstantVariableConfig = {
        accountId: accountId,
        containerId: containerId,
        name: 'CONST - Measurement ID',
        type: VariableTypeEnum.CONSTANT,
        parameter: [
          parameterUtils.createTemplateParameter('value', measurementId)
        ],
        fingerprint: '1734756121031',
        formatValue: {}
      };

      expect(result).toEqual(expected);
    });

    it('should create a measurement ID constant variable with default G-0 when no ID provided', () => {
      // Arrange
      const accountId = 'test-account';
      const containerId = 'test-container';

      // Act
      const result = service.createMeasurementIdConstantVariable(
        accountId,
        containerId,
        null
      );

      // Assert
      expect(result.parameter[0]).toEqual(
        parameterUtils.createTemplateParameter('value', 'G-0')
      );
      expect(result.name).toBe('CONST - Measurement ID');
      expect(result.type).toBe('c');
    });
  });
});
