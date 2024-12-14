import { Injectable } from '@angular/core';
import { Parameter, ParameterMap, Trigger } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class ParameterUtils {
  createListParameter(key: string, parameters: Parameter[]): Parameter {
    const list = parameters.map((param) => {
      return this.createMapParameter(param.key, `{{DLV - ${param.value}}}`);
    });
    return {
      type: 'LIST',
      key,
      list
    };
  }

  createBuiltInListParameter(key: string, mapParameters: ParameterMap[]) {
    return {
      type: 'LIST',
      key,
      list: [...mapParameters]
    };
  }

  createMapParameter(name: string, value: string): ParameterMap {
    return {
      type: 'MAP',
      map: [
        this.createTemplateParameter('parameter', name),
        this.createTemplateParameter('parameterValue', value)
      ]
    };
  }

  createIntegerParameter(key: string, value: string): Parameter {
    return {
      type: 'INTEGER',
      key,
      value
    };
  }

  createBooleanParameter(key: string, value: string): Parameter {
    return {
      type: 'BOOLEAN',
      key,
      value
    };
  }

  createTagReferenceParameter(key: string, value: string): Parameter {
    return {
      type: 'TAG_REFERENCE',
      key,
      value
    };
  }

  createTemplateParameter(key: string, value: string): Parameter {
    return {
      type: 'TEMPLATE',
      key,
      value
    };
  }

  findTriggerIdByEventName(eventName: string, triggers: Trigger[]): string[] {
    const matchedTriggers = triggers.filter((t) => t.name === eventName);
    // TODO: typing exercise
    const triggerIds = matchedTriggers.map((t) => t.triggerId as any);
    return triggerIds;
  }
}
