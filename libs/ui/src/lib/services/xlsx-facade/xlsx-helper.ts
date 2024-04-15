import { DataRow } from '../../interfaces/gtm-config-generator';
import { fixJsonString } from '../converter/utilities/json-string-utils';

export const unfixedableJsonString: Set<string> = new Set();

export function filterGtmSpecsFromData(data: DataRow[]) {
  return data
    .map((row) => {
      if (
        Object.values(row).some(
          (value) =>
            typeof value === 'string' && value.includes('window.dataLayer.push')
        )
      ) {
        return row;
      }
      return {};
    })
    .filter((item) => Object.keys(item).length !== 0);
}

export function convertSpecStringToObject(spec: DataRow): any {
  const inputString = Object.values(spec)[0];
  // Match all occurrences of window.dataLayer.push(...)
  const matches = [
    ...inputString.matchAll(/window\.dataLayer\.push\(([^)]+)\)/g),
  ];

  // Check if the match has the string 'event: "view_item_list"'
  const desiredMatch = matches.find((match) => match[1].includes('event'));

  let jsonString =
    desiredMatch && desiredMatch[1] ? desiredMatch[1] : inputString;

  // Try parsing the JSON string directly
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    // If direct parsing fails, attempt to fix and parse again
    try {
      return JSON.parse(fixJsonString(jsonString));
    } catch (nestedError) {
      console.error('Failed to parse:', jsonString, nestedError);
      unfixedableJsonString.add(jsonString);
      return null;
    }
  }
}

export function filterNonEmptyData(data: any[]) {
  // 1. Find the column index
  let columnIndex: number = 0;
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
