import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';
import { ConstantVariableConfig, VariableTypeEnum } from '@utils';
import { MEASUREMENT_ID_VARIABLE_NAME } from '../utils/constant';

/** Builds the Constant variable that holds the GA4 measurement ID. */
@Injectable({
  providedIn: 'root'
})
export class ConstantVariable {
  constructor(private readonly parameterUtils: ParameterUtils) {}

  /** Uses the placeholder `G-0` when no measurement ID is given. */
  createMeasurementIdConstantVariable(
    accountId: string,
    containerId: string,
    measurementId: string
  ): ConstantVariableConfig {
    return {
      accountId: accountId,
      containerId: containerId,
      name: MEASUREMENT_ID_VARIABLE_NAME,
      type: VariableTypeEnum.CONSTANT,
      parameter: [
        this.parameterUtils.createTemplateParameter(
          'value',
          measurementId || 'G-0'
        )
      ],
      fingerprint: '1734756121031',
      formatValue: {}
    };
  }
}
