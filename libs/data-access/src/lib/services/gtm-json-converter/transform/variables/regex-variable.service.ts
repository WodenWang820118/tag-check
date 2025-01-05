import { RegexVariableConfig, VariableTypeEnum } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class RegexVariable {
  constructor(private parameterUtils: ParameterUtils) {}
  createRegexMeasurementIdVariable(
    accountId: string,
    containerId: string
  ): RegexVariableConfig {
    return {
      name: `Measurement ID`,
      type: VariableTypeEnum.REGEX,
      accountId,
      containerId,
      parameter: [
        this.parameterUtils.createBooleanParameter('setDefaultValue', 'true'),
        this.parameterUtils.createTemplateParameter('input', '{{Page URL}}'),
        this.parameterUtils.createBooleanParameter('fullMatch', 'false'),
        this.parameterUtils.createBooleanParameter(
          'replaceAfterMatch',
          'false'
        ),
        this.parameterUtils.createTemplateParameter('defaultValue', 'G-1'),
        this.parameterUtils.createBooleanParameter('ignoreCase', 'true')
      ],
      fingerprint: '1696861232768',
      formatValue: {}
    };
  }
}
