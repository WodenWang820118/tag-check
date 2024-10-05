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
    console.log('dataLayers', dataLayers);
    console.log('parameters', parameters);

    // Filter out 'ecommerce' from dataLayers and create a Set for efficient lookup
    const ecommerceDataLayers = new Set(
      dataLayers.filter((layer) => layer.startsWith('ecommerce.'))
    );

    const list = parameters.map((param) => {
      const ecommerceKey = `ecommerce.${param.key}`;
      if (ecommerceDataLayers.has(ecommerceKey)) {
        return this.createMapParameter(param.key, `{{DLV - ${ecommerceKey}}}`);
      }
      return this.createMapParameter(param.key, `{{DLV - ${param.value}}}`);
    });

    return {
      type: 'LIST',
      key,
      list,
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
