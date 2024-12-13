import { TriggerConfig } from '@utils';
import { Injectable } from '@angular/core';
import { ParameterUtils } from '../utils/parameter-utils.service';

@Injectable({
  providedIn: 'root'
})
export class EventTrigger {
  constructor(private parameterUtils: ParameterUtils) {}
  createTrigger(
    accountId: string,
    containerId: string,
    trigger: string
  ): TriggerConfig {
    return {
      accountId,
      containerId,
      type: 'CUSTOM_EVENT',
      name: `event equals ${trigger}`,
      customEventFilter: [
        {
          type: 'EQUALS',
          parameter: [
            this.parameterUtils.createTemplateParameter('arg0', '{{_event}}'),
            this.parameterUtils.createTemplateParameter('arg1', trigger)
          ]
        }
      ]
    };
  }
}
