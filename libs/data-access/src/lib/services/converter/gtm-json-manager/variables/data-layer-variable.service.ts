import { Parameter, VariableConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class DataLayerVariable {
  constructor(private parameterUtils: ParameterUtils) {}
  createDataLayerVariable(
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
        )
      ]
    };
  }

  createEventSettingsVariable(
    accountId: string,
    containerId: string,
    data: {
      formattedParameters: Parameter[];
      eventName: string;
    }[],
    esvContent: {
      name: string;
      parameters: { [x: string]: string }[];
    }[]
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
    // temporary comments for testing
    // {
    //   "accountId": "6140708819",
    //   "containerId": "168785492",
    //   "variableId": "195",
    //   "name": "Google Tag G-8HK542DQMG Event Settings",
    //   "type": "gtes",
    //   "parameter": [
    //     {
    //       "type": "LIST",
    //       "key": "eventSettingsTable",
    //       "list": [
    //         {
    //           "type": "MAP",
    //           "map": [
    //             {
    //               "type": "TEMPLATE",
    //               "key": "parameter",
    //               "value": "page_referrer"
    //             },
    //             {
    //               "type": "TEMPLATE",
    //               "key": "parameterValue",
    //               "value": "{{page_referrer for G-8HK542DQMG Tags | String}}"
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   ],
    //   "fingerprint": "1703652484999"
    // }
  }
}
