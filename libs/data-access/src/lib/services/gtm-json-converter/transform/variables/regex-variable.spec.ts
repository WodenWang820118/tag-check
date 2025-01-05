import { TestBed } from '@angular/core/testing';
import { RegexVariable } from './regex-variable.service';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { RegexVariableConfig, VariableTypeEnum } from '@utils';

describe('RegexVariable', () => {
  let service: RegexVariable;
  let parameterUtils: ParameterUtils;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RegexVariable, ParameterUtils]
    });

    service = TestBed.inject(RegexVariable);
    parameterUtils = TestBed.inject(ParameterUtils);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a regex measurement ID variable config correctly', () => {
    const accountId = 'test-account';
    const containerId = 'test-container';

    const result = service.createRegexMeasurementIdVariable(
      accountId,
      containerId
    );
    const expected: RegexVariableConfig = {
      name: 'Measurement ID',
      type: VariableTypeEnum.REGEX,
      accountId: 'test-account',
      containerId: 'test-container',
      parameter: [
        { type: 'BOOLEAN', key: 'setDefaultValue', value: 'true' },
        { type: 'TEMPLATE', key: 'input', value: '{{Page URL}}' },
        { type: 'BOOLEAN', key: 'fullMatch', value: 'false' },
        { type: 'BOOLEAN', key: 'replaceAfterMatch', value: 'false' },
        { type: 'TEMPLATE', key: 'defaultValue', value: 'G-1' },
        { type: 'BOOLEAN', key: 'ignoreCase', value: 'true' }
      ],
      fingerprint: '1696861232768',
      formatValue: {}
    };

    expect(result).toEqual(expected);
  });

  it('should use the provided accountId and containerId', () => {
    const accountId = 'custom-account';
    const containerId = 'custom-container';

    const result = service.createRegexMeasurementIdVariable(
      accountId,
      containerId
    );

    expect(result.accountId).toBe('custom-account');
    expect(result.containerId).toBe('custom-container');
  });
});
