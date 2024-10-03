import { Injectable } from '@angular/core';
import { Parameter, ParameterMap, TriggerConfig } from '@utils';

@Injectable({
  providedIn: 'root',
})
export class ParameterUtils {
  createListParameter(
    key: string,
    dataLayers: string[],
    parameters: Parameter[]
  ): Parameter {
    // TODO: mistery using dataLayers with the prefix 'ecommerce.'
    return {
      type: 'LIST',
      key,
      list: parameters.map((param: Parameter) => {
        return this.createMapParameter(
          param.key.trim(),
          `{{DLV - ${param.value as string}}}`
        );
      }),
    };
  }

  createBuiltInListParameter(key: string, mapParameters: ParameterMap[]) {
    return {
      type: 'LIST',
      key,
      list: [...mapParameters],
    };
  }

  createMapParameter(name: string, value: string): ParameterMap {
    return {
      type: 'MAP',
      map: [
        this.createTemplateParameter('name', name),
        this.createTemplateParameter('value', value),
      ],
    };
  }

  createIntegerParameter(key: string, value: string): Parameter {
    return {
      type: 'INTEGER',
      key,
      value,
    };
  }

  createBooleanParameter(key: string, value: string): Parameter {
    return {
      type: 'BOOLEAN',
      key,
      value,
    };
  }

  createTagReferenceParameter(key: string, value: string): Parameter {
    return {
      type: 'TAG_REFERENCE',
      key,
      value,
    };
  }

  createTemplateParameter(key: string, value: string): Parameter {
    return {
      type: 'TEMPLATE',
      key,
      value,
    };
  }

  findTriggerIdByEventName(
    eventName: string,
    triggers: TriggerConfig[]
  ): string {
    const trigger = triggers.find(
      (t) => t.customEventFilter?.[0]?.parameter?.[1]?.value === eventName
    );
    return trigger?.triggerId ?? '';
  }
}
