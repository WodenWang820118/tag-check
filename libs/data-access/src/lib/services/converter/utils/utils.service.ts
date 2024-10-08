import { Injectable } from '@angular/core';
import { NestedObject } from '@utils';

@Injectable({
  providedIn: 'root',
})
export class Utils {
  constructor() {}
  preprocessInput(inputString: string) {
    try {
      // Attempt to parse the input JSON string
      JSON.parse(inputString);
      return inputString;
    } catch (error) {
      // If parsing fails, attempt to fix common issues and try again
      let fixedString = '';
      fixedString = this.fixJsonString(inputString);

      // Attempt to parse the fixed string
      try {
        JSON.parse(fixedString);
        return fixedString;
      } catch (error) {
        console.error(error);
        return 'null';
      }
    }
  }

  extractAccountAndContainerId(url: string) {
    const regex = /accounts\/(\d+)\/containers\/(\d+)/;
    const result = regex.exec(url);
    if (result) {
      return {
        accountId: result[1],
        containerId: result[2],
      };
    }
    return {
      accountId: '',
      containerId: '',
    };
  }

  outputTime() {
    //output the time like the format: 2023-08-03 02:16:33
    const date: Date = new Date();

    let year: number = date.getFullYear();

    let month: number | string = date.getMonth() + 1; // getMonth() is zero-indexed, so we need to add 1
    month = month < 10 ? '0' + month : month; // ensure month is 2-digits

    let day: number | string = date.getDate();
    day = day < 10 ? '0' + day : day; // ensure day is 2-digits

    let hours: number | string = date.getHours();
    hours = hours < 10 ? '0' + hours : hours; // ensure hours is 2-digits

    let minutes: number | string = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes; // ensure minutes is 2-digits

    let seconds: number | string = date.getSeconds();
    seconds = seconds < 10 ? '0' + seconds : seconds; // ensure seconds is 2-digits

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

  /**
   * A function to get all paths from the root to each leaf node in a nested object.
   *
   * @param obj - The nested object to get the paths from.
   * @param prefix - The current path prefix, used during recursion.
   * @returns An array of paths. Each path is a string with properties separated by dots.
   *
   * @example
   * // returns ['a', 'b', 'b.c', 'b.d', 'b.d.e']
   * getAllObjectPaths({ a: 1, b: { c: 2, d: { e: 3 } } })
   */
  getAllObjectPaths(obj: NestedObject, prefix = ''): string[] {
    let paths: string[] = [];

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const path = prefix ? `${prefix}.${key}` : key;
        paths.push(path);

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const nestedPaths = this.getAllObjectPaths(obj[key], path);
          paths = paths.concat(nestedPaths);
        }
      }
    }
    return paths;
  }
}
