import { EventSettingsVariable, Parameter, VariableConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class DataLayerVariable {
  constructor(private parameterUtils: ParameterUtils) {}
  createDataLayerVariable(
    accountId: string,
    containerId: string,
    dataLayerNames: string[]
  ): VariableConfig[] {
    return dataLayerNames.map((dataLayerName) => {
      return {
        name: `DLV - ${dataLayerName.trim()}`,
        type: 'v',
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

  createEventSettingsVariable(
    accountId: string,
    containerId: string,
    esvContent: EventSettingsVariable[]
  ): VariableConfig[] {
    return esvContent.map((param) => {
      return {
        accountId,
        containerId,
        name: `ESV - ${param.name}`,
        type: 'gtes',
        parameter: [
          {
            type: 'LIST',
            key: 'eventSettingsTable',
            list: param.parameters.map((p) => {
              // Get the first (and only) key-value pair from the object
              const key = Object.keys(p)[0];
              const value = p[key];

              return {
                type: 'MAP',
                map: [
                  this.parameterUtils.createTemplateParameter('parameter', key),
                  this.parameterUtils.createTemplateParameter(
                    'parameterValue',
                    value
                  )
                ]
              };
            })
          }
        ]
      };
    });
  }
}
