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
      let fixedString = '';
      fixedString = this.fixJsonString(inputString);

      // Attempt to parse the fixed string
      try {
        return JSON.parse(fixedString) as Spec[];
      } catch (error) {
        console.error(error);
        return [
          {
            event: 'error'
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
      let lines = fixedString.split('\n');
      for (let i = 0; i < lines.length; i++) {
        let commentIndex = lines[i].indexOf('//');
        if (commentIndex >= 0) {
          let precedingChars = lines[i].substring(0, commentIndex);
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
        /([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)(\s*:)/g,
        '$1"$2"$3'
      );

      // Fix unquoted values (except true, false, and null) by wrapping them with quotes
      fixedString = fixedString.replace(
        /(:\s*)([^"{}\[\],\s]+)(?=\s*[,\]}])/g,
        (match, p1, p2) => {
          if (['true', 'false', 'null'].includes(p2)) return match;
          return `${p1}"${p2}"`;
        }
      );

      // Remove any trailing commas
      fixedString = fixedString.replace(/,\s*([\]}])/g, '$1');

      return fixedString;
    } catch (error) {
      throw new Error('Failed to fix JSON parsing issues');
    }
  }

  // parseAllSpecs(inputString: string): Record<string, string>[] {
  //   try {
  //     const allSpecs = JSON.parse(inputString);
  //     return allSpecs.map(this.parseSpec.bind(this));
  //   } catch (error) {
  //     console.error('Error parsing specs:', error);
  //     throw new Error(
  //       'Cannot parse JSON. Please revise the format to follow JSON structure rules'
  //     );
  //   }
  // }

  // private parseSpec(
  //   parsedJSON: Record<string, string>
  // ): Record<string, string> {
  //   if (parsedJSON) {
  //     const { event, ...json } = parsedJSON;
  //     const paths = this.utilsService.getAllObjectPaths(json);
  //     this.dataLayerUtils.addDataLayer(paths);
  //     return parsedJSON;
  //   } else {
  //     throw new Error('Invalid spec format');
  //   }
  // }
}
