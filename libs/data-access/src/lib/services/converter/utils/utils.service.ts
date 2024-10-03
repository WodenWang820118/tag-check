import { Injectable } from '@angular/core';
import { JsonStringUtils } from './json-string-utils.service';

@Injectable({
  providedIn: 'root',
})
export class Utils {
  constructor(private jsonStringUtils: JsonStringUtils) {}
  preprocessInput(inputString: string) {
    try {
      // Attempt to parse the input JSON string
      JSON.parse(inputString);
      return inputString;
    } catch (error) {
      // If parsing fails, attempt to fix common issues and try again
      let fixedString = '';
      fixedString = this.jsonStringUtils.fixJsonString(inputString);

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
}
