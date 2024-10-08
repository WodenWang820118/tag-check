import { TestBed } from '@angular/core/testing';
import { CustomJSVariable } from './custom-variable.service';

describe('CustomJSVariable', () => {
  let service: CustomJSVariable;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CustomJSVariable],
    });
    service = TestBed.inject(CustomJSVariable);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a custom JS variable with the correct structure', () => {
    const testData = {
      stagingMeasurementId: 'STAGING_ID',
      stagingUrl: 'https://staging.example.com',
      productionMeasurementId: 'PROD_ID',
      productionUrl: 'https://production.example.com',
    };

    const result = service.createMeasurementIdCustomJSVariable(testData);

    expect(result).toContain(
      `var MEASUREMENT_ID_STAGING = '${testData.stagingMeasurementId}'`
    );
    expect(result).toContain(
      `var MEASUREMENT_ID_PROD = '${testData.productionMeasurementId}'`
    );
    expect(result).toContain(
      `if(originUrl === '${testData.stagingUrl}') return MEASUREMENT_ID_STAGING`
    );
    expect(result).toContain(
      `if(originUrl === '${testData.productionUrl}') return MEASUREMENT_ID_PROD`
    );
    expect(result).toContain(`throw new Error('Invalid environment provided')`);
  });

  it('should handle missing data gracefully', () => {
    const incompleteData = {
      stagingMeasurementId: 'STAGING_ID',
      productionUrl: 'https://production.example.com',
    };

    const result = service.createMeasurementIdCustomJSVariable(incompleteData);

    expect(result).toContain(`var MEASUREMENT_ID_STAGING = 'STAGING_ID'`);
    expect(result).toContain(`var MEASUREMENT_ID_PROD = 'undefined'`);
    expect(result).toContain(
      `if(originUrl === 'undefined') return MEASUREMENT_ID_STAGING`
    );
    expect(result).toContain(
      `if(originUrl === 'https://production.example.com') return MEASUREMENT_ID_PROD`
    );
  });
});
