import { VariableConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../parameter-utils.service';

@Injectable({
  providedIn: 'root',
})
export class DataLayerVariable {
  constructor(private parameterUtils: ParameterUtils) {}
  createVariable(
    accountId: string,
    containerId: string,
    dataLayerName: string
  ): VariableConfig {
    return {
      name: `DLV - ${dataLayerName.trim()}`,
      type: 'v',
      accountId,
      containerId,
      parameter: [
        this.parameterUtils.createIntegerParameter('dataLayerVersion', '2'),
        this.parameterUtils.createBooleanParameter('setDefaultValue', 'false'),
        this.parameterUtils.createTemplateParameter(
          'name',
          dataLayerName.trim()
        ),
      ],
    };
  }
}
