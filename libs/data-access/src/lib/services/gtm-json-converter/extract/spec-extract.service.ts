import {
  StrictDataLayerEvent,
  fixJsonString,
  isStrictDataLayerEvent,
  isStrictDataLayerEventArray
} from '@utils';
import { Injectable } from '@angular/core';

/**
 * Reads the specs typed or uploaded into tag-build's input editor.
 */
@Injectable({
  providedIn: 'root'
})
export class SpecExtractService {
  /**
   * Parses the input as JSON, repairing JavaScript-style object literals
   * when plain JSON fails, and returns it as an array of dataLayer specs. A
   * single event object becomes a one-item array. Throws a user-facing
   * error when the text does not parse or an entry has no string `event`.
   */
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

  /**
   * See {@link fixJsonString} in `@utils`; kept as a method so tests can spy on it.
   */
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
