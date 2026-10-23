import {
  StrictDataLayerEvent,
  fixJsonString,
  isStrictDataLayerEvent,
  isStrictDataLayerEventArray
} from '@utils';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpecExtractService {
  preprocessInput(inputString: string): StrictDataLayerEvent[] {
    const parsedInput = this.parseInput(inputString);

    try {
      return this.normalizeSpecs(parsedInput);
    } catch (error) {
      console.error(error);
      throw new Error('Error parsing spec JSON. Please check the format.');
    }
  }

  private normalizeSpecs(input: unknown): StrictDataLayerEvent[] {
    if (isStrictDataLayerEventArray(input)) {
      return input;
    }

    if (isStrictDataLayerEvent(input)) {
      return [input];
    }

    throw new Error(
      'Spec JSON must be an event object or an array of event objects.'
    );
  }

  fixJsonString(inputString: string): string {
    return fixJsonString(inputString);
  }

  private parseInput(inputString: string): unknown {
    try {
      return JSON.parse(inputString) as unknown;
    } catch (error) {
      console.warn(
        'JSON parsing failed, attempting to fix common issues:',
        error
      );
      const fixedString = this.fixJsonString(inputString);

      try {
        return JSON.parse(fixedString) as unknown;
      } catch (repairError) {
        console.error(repairError);
        throw new Error('Error parsing spec JSON. Please check the format.');
      }
    }
  }
}
