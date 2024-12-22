import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class ConstantVariable {
  constructor(private parameterUtils: ParameterUtils) {}
  createMeasurementIdConstantVariable(
    accountId: string,
    containerId: string,
    measurementId: string
  ) {
    const measurementIdConstantVariable = {
      accountId: accountId,
      containerId: containerId,
      name: 'CONST - Measurement ID',
      type: 'c',
      parameter: [
        this.parameterUtils.createTemplateParameter(
          'value',
          measurementId ? measurementId : 'G-0'
        )
      ],
      fingerprint: '1734756121031',
      formatValue: {}
    };
    return measurementIdConstantVariable;
  }
}
