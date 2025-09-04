import { Injectable } from '@angular/core';
import { Parameter, ParameterMap, Trigger } from '@utils';

/**
 * Service for constructing GTM JSON parameters and utilities for data layer variables.
 *
 * Provides factory methods to create various parameter types (LIST, MAP, INTEGER, BOOLEAN, TEMPLATE, TAG_REFERENCE)
 * and to extract trigger IDs by event name.
 */
@Injectable({
  providedIn: 'root'
})
export class ParameterUtils {
  /**
   * Create a LIST parameter from data layer variables.
   * @param key The list parameter key.
   * @param parameters Array of base parameters to wrap.
   * @returns A {@link Parameter} of type LIST containing mapped parameters.
   */
  createListParameter(key: string, parameters: Parameter[]): Parameter {
    // Guard against optional key/value in Parameter type
    const list = parameters
      .filter(
        (
          param
        ): param is Parameter & Required<Pick<Parameter, 'key' | 'value'>> =>
          typeof param.key === 'string' && typeof param.value === 'string'
      )
      .map((param) =>
        this.createMapParameter(param.key, `{{DLV - ${param.value}}}`)
      );
    return { type: 'LIST', key, list };
  }

  /**
   * Create a LIST parameter from existing map parameters.
   * @param key The list parameter key.
   * @param mapParameters Array of {@link ParameterMap} items.
   * @returns A LIST {@link Parameter} containing the provided maps.
   */
  createBuiltInListParameter(
    key: string,
    mapParameters: ParameterMap[]
  ): Parameter {
    return { type: 'LIST', key, list: [...mapParameters] };
  }

  /**
   * Create a MAP parameter containing template entries for key and value.
   * @param name The map entry key.
   * @param value The map entry value.
   * @returns A {@link ParameterMap} of type MAP.
   */
  createMapParameter(name: string, value: string): ParameterMap {
    return {
      type: 'MAP',
      map: [
        this.createTemplateParameter('parameter', name),
        this.createTemplateParameter('parameterValue', value)
      ]
    };
  }

  /**
   * Create an INTEGER parameter.
   * @param key The parameter key.
   * @param value The integer value as string.
   * @returns An INTEGER {@link Parameter}.
   */
  createIntegerParameter(key: string, value: string): Parameter {
    return this.buildParameter('INTEGER', key, value);
  }

  /**
   * Create a BOOLEAN parameter.
   * @param key The parameter key.
   * @param value The boolean value as string.
   * @returns A BOOLEAN {@link Parameter}.
   */
  createBooleanParameter(key: string, value: string): Parameter {
    return this.buildParameter('BOOLEAN', key, value);
  }

  /**
   * Create a TAG_REFERENCE parameter.
   * @param key The parameter key.
   * @param value The tag reference ID.
   * @returns A TAG_REFERENCE {@link Parameter}.
   */
  createTagReferenceParameter(key: string, value: string): Parameter {
    return this.buildParameter('TAG_REFERENCE', key, value);
  }

  /**
   * Create a TEMPLATE parameter.
   * @param key The parameter key.
   * @param value The template string value.
   * @returns A TEMPLATE {@link Parameter}.
   */
  createTemplateParameter(key: string, value: string): Parameter {
    return this.buildParameter('TEMPLATE', key, value);
  }

  /**
   * Find trigger IDs matching a specific event name.
   * @param eventName The name of the event to match.
   * @param triggers Array of GTM {@link Trigger} objects.
   * @returns An array of matching trigger IDs.
   */
  findTriggerIdByEventName(eventName: string, triggers: Trigger[]): string[] {
    return triggers.filter((t) => t.name === eventName).map((t) => t.triggerId);
  }
  /**
   * Create a simple parameter with the given type, key, and value.
   * @param type The parameter type.
   * @param key The parameter key.
   * @param value The parameter value.
   * @returns A {@link Parameter} with specified properties.
   */
  private buildParameter(
    type: Parameter['type'],
    key: string,
    value: string
  ): Parameter {
    return { type, key, value };
  }
}
