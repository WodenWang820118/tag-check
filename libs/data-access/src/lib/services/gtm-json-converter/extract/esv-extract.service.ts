import { Injectable } from '@angular/core';
import { EventSettingsVariable } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class EsvExtractService {
  isEventSettingsVariable(obj: any): obj is EventSettingsVariable {
    // Check if obj is an object
    if (typeof obj !== 'object' || obj === null) {
      throw new Error('Input must be an object');
    }

    // Check name property
    if (typeof obj.name !== 'string') {
      throw new Error('name property must be a string');
    }

    // Check parameters property
    if (!Array.isArray(obj.parameters)) {
      throw new Error('parameters must be an array');
    }

    // Validate each parameter object
    for (let i = 0; i < obj.parameters.length; i++) {
      const param = obj.parameters[i];
      if (typeof param !== 'object' || param === null) {
        throw new Error(`parameters[${i}] must be an object`);
      }

      // Check all values are strings
      for (const [key, value] of Object.entries(param)) {
        if (typeof value !== 'string') {
          throw new Error(`parameters[${i}][${key}] must be a string`);
        }
      }
    }

    return true;
  }

  parseEventSettingVariables(spec: string): EventSettingsVariable {
    try {
      const parsed = JSON.parse(spec);
      if (this.isEventSettingsVariable(parsed)) {
        return parsed;
      }
      throw new Error('Invalid EventSettingsVariable format');
    } catch (error) {
      throw new Error(`Failed to parse EventSettingsVariable: ${error}`);
    }
  }
}
