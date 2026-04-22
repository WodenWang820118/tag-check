import {
  StrictDataLayerEvent,
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

  fixJsonString(inputString: string) {
    try {
      let fixedString = inputString;

      // Remove multi-line comments first (/**/)
      fixedString = fixedString.replaceAll(/\/\*[\s\S]*?\*\//gm, '');

      // Remove single-line comments that appear after JSON values
      const lines = fixedString.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const commentIndex = lines[i].indexOf('//');
        if (commentIndex >= 0) {
          const precedingChars = lines[i].substring(0, commentIndex);
          if (/[:,]\s*$/.test(precedingChars)) {
            // Comment appears after a JSON value, remove only the comment
            lines[i] = lines[i].substring(0, commentIndex);
          }
        }
      }

      fixedString = lines.join('\n');

      // Convert single-quoted JSON keys and string values without
      // rewriting apostrophes inside already double-quoted content.
      fixedString = fixedString.replaceAll(
        /([{,]\s*)'([^']+)'(\s*:)/g,
        '$1"$2"$3'
      );
      fixedString = fixedString.replaceAll(
        /(:\s*)'([^']*)'(?=\s*[,}\]])/g,
        '$1"$2"'
      );

      // Wrap unquoted property names with double quotes
      fixedString = fixedString.replaceAll(
        /([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,
        '$1"$2"$3'
      );

      // Fix unquoted values (except true, false, and null) by wrapping them with quotes
      fixedString = fixedString.replaceAll(
        /(:\s*)([^"{}[\],\s]+)(?=\s*[,\]}])/g,
        (match, p1, p2) => {
          if (['true', 'false', 'null'].includes(p2)) return match;
          return `${p1}"${p2}"`;
        }
      );

      // Remove any trailing commas
      fixedString = fixedString.replaceAll(/,\s*([\]}])/g, '$1');

      return fixedString;
    } catch (error) {
      throw new Error('Failed to fix JSON parsing issues: ' + error);
    }
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
