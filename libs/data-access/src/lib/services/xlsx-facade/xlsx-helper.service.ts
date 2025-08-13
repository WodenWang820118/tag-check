/* eslint-disable @typescript-eslint/no-explicit-any */
import { DataRow } from '@utils';
import { Injectable } from '@angular/core';
import { SpecExtractService } from '../gtm-json-converter/extract/spec-extract.service';

@Injectable({
  providedIn: 'root'
})
export class XlsxHelper {
  constructor(private readonly specExtractService: SpecExtractService) {}
  unfixedableJsonString: Set<string> = new Set();
  filterGtmSpecsFromData(data: DataRow[]) {
    return data
      .map((row) => {
        if (
          Object.values(row).some(
            (value) =>
              typeof value === 'string' &&
              value.includes('window.dataLayer.push')
          )
        ) {
          return row;
        }
        return {};
      })
      .filter((item) => Object.keys(item).length !== 0);
  }

  convertSpecStringToObject(spec: DataRow): any {
    const inputString = Object.values(spec)[0];
    // Match all occurrences of window.dataLayer.push(...)
    const matches = [
      ...inputString.matchAll(/window\.dataLayer\.push\(([^)]+)\)/g)
    ];

    // Check if the match has the string 'event: "view_item_list"'
    const desiredMatch = matches.find((match) => match[1].includes('event'));

    const jsonString =
      desiredMatch && desiredMatch[1] ? desiredMatch[1] : inputString;

    // Try parsing the JSON string directly
    try {
      return JSON.parse(jsonString);
    } catch (error) {
      // If direct parsing fails, attempt to fix and parse again
      console.error('Failed to parse:', jsonString, error);
      try {
        return JSON.parse(this.specExtractService.fixJsonString(jsonString));
      } catch (nestedError) {
        console.error('Failed to parse:', jsonString, nestedError);
        this.unfixedableJsonString.add(jsonString);
        return null;
      }
    }
  }

  filterNonEmptyData(data: any[]) {
    // 1. Find the column index
    let columnIndex = 0;
    const lastColumnIndex = Object.keys(data[0]).length - 1;

    for (const row of data) {
      // find the last non-empty value in the row
      const foundIndex = Object.values(row).findLastIndex(
        (value) => value !== ''
      );

      if (foundIndex !== -1 && foundIndex > columnIndex) {
        // update the column index if a non-empty value is found
        columnIndex = foundIndex;
      }
    }

    // 2. Extract all non-empty values from the identified column
    for (const row of data) {
      Object.keys(row).forEach((key, index) => {
        if (index > columnIndex && index <= lastColumnIndex) {
          delete row[key];
        }
      });
    }
    return data;
  }
}
