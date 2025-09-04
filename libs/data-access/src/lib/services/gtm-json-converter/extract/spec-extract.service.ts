import { Spec } from '@utils';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SpecExtractService {
  preprocessInput(inputString: string) {
    try {
      // Attempt to parse the input JSON string
      return JSON.parse(inputString) as Spec[];
    } catch (error) {
      // If parsing fails, attempt to fix common issues and try again
      console.warn(
        'JSON parsing failed, attempting to fix common issues:',
        error
      );
      let fixedString = '';
      fixedString = this.fixJsonString(inputString);

      // Attempt to parse the fixed string
      try {
        return JSON.parse(fixedString) as Spec[];
      } catch (error) {
        console.error(error);
        return [
          {
            tag: { name: 'Error parsing spec JSON. Please check the format.' }
          }
        ] as Spec[];
      }
    }
  }

  fixJsonString(inputString: string) {
    try {
      let fixedString = inputString;

      // Remove multi-line comments first (/**/)
      fixedString = fixedString.replace(/\/\*[\s\S]*?\*\//gm, '');

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

      // Replace single quotes with double quotes
      fixedString = fixedString.replace(/'/g, '"');

      // Handle mismatched quotes
      fixedString = fixedString.replace(/"([^"]*)'(?![^"]*")/g, '"$1"');
      fixedString = fixedString.replace(/(?<![^"]*')'([^"]*)"/g, '"$1"');

      // Wrap unquoted property names with double quotes
      fixedString = fixedString.replace(
        /([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g,
        '$1"$2"$3'
      );

      // Fix unquoted values (except true, false, and null) by wrapping them with quotes
      fixedString = fixedString.replace(
        /(:\s*)([^"{}[\],\s]+)(?=\s*[,\]}])/g,
        (match, p1, p2) => {
          if (['true', 'false', 'null'].includes(p2)) return match;
          return `${p1}"${p2}"`;
        }
      );

      // Remove any trailing commas
      fixedString = fixedString.replace(/,\s*([\]}])/g, '$1');

      return fixedString;
    } catch (error) {
      throw new Error('Failed to fix JSON parsing issues: ' + error);
    }
  }
}
