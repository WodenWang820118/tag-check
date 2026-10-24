import {
  EventSettingsVariable,
  EventSettingsVariableConfig,
  VariableTypeEnum
} from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

/**
 * Builds Event Settings variables (`ESV - <name>`) from the JSON typed in
 * the advanced options. Each parameter object contributes its first key
 * and value as one row.
 */
@Injectable({
  providedIn: 'root'
})
export class EventSettingsVariableService {
  constructor(private readonly parameterUtils: ParameterUtils) {}
  createEventSettingsVariable(
    accountId: string,
    containerId: string,
    esvContent: EventSettingsVariable[]
  ): EventSettingsVariableConfig[] {
    return esvContent.map((param) => {
      return {
        accountId,
        containerId,
        name: `ESV - ${param.name}`,
        type: VariableTypeEnum.EVENT_SETTINGS,
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
