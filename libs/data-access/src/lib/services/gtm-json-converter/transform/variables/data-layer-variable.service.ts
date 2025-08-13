import { DataLayerVariableConfig, VariableTypeEnum } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class DataLayerVariable {
  constructor(private readonly parameterUtils: ParameterUtils) {}
  createDataLayerVariable(
    accountId: string,
    containerId: string,
    dataLayerNames: string[]
  ): DataLayerVariableConfig[] {
    return dataLayerNames.map((dataLayerName) => {
      return {
        name: `DLV - ${dataLayerName.trim()}`,
        type: VariableTypeEnum.DATA_LAYER,
        accountId,
        containerId,
        parameter: [
          this.parameterUtils.createIntegerParameter('dataLayerVersion', '2'),
          this.parameterUtils.createBooleanParameter(
            'setDefaultValue',
            'false'
          ),
          this.parameterUtils.createTemplateParameter(
            'name',
            dataLayerName.trim()
          )
        ]
      };
    });
  }
}
