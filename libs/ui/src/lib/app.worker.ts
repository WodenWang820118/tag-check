/// <reference lib="webworker" />

import { read, utils } from 'xlsx';
import { DataRow } from './interfaces/gtm-config-generator';

addEventListener('message', (event) => {
  const { cmd, action, data } = event.data;
  switch (action) {
    case 'readXlsx': {
      const workbook = read(data, { type: 'array' });
      const sheetNames = workbook.SheetNames;
      let jsonData = utils.sheet_to_json(workbook.Sheets[sheetNames[0]], {
        defval: '',
      }); // default to first sheet
      postMessage({
        action: `${action}`,
        workbook,
        sheetNames,
        jsonData,
      });
      break;
    }
    case 'switchSheet': {
      const { data, name } = event.data;
      let jsonData = getSheetData(data, name);
      postMessage({ action: `${action}`, jsonData });
      break;
    }
    case 'extractSpecs': {
      const { data, name } = event.data;
      const jsonData = extractSpecs(data, name);
      postMessage({ action: `${action}`, jsonData });
      break;
    }
    case 'previewData': {
      const { data, name } = event.data;
      const jsonData = extractSpecs(data, name);
      postMessage({ action: `${action}`, jsonData });
      break;
    }
    default: {
      // console.warn(`Unknown action: ${action}`);
      break;
    }
  }
});

function getSheetData(workbook: any, sheetName: string): string[] {
  for (let i = 0; i < workbook.SheetNames.length; i++) {
    if (workbook.SheetNames[i] === sheetName) {
      const worksheet = workbook.Sheets[workbook.SheetNames[i]];
      const jsonData = utils.sheet_to_json<any>(worksheet, { defval: '' });
      return jsonData;
    }
  }
  return [];
}

function extractSpecs(data: DataRow[], specTitle: string): DataRow[] {
  let columnIndex: number | null = null;

  for (const row of data) {
    const foundIndexKey = Object.keys(row).findIndex(
      (key) => key === specTitle
    );
    const foundIndex = Object.values(row).findIndex(
      (value) => value === specTitle
    );

    if (foundIndexKey !== -1) {
      return extractSpecsByColumnIndex(data, foundIndexKey);
    }

    if (foundIndex !== -1) {
      columnIndex = foundIndex;
      break;
    }
  }

  if (columnIndex === null) {
    return [];
  }

  return extractSpecsByColumnIndex(data, columnIndex);
}

function extractSpecsByColumnIndex(
  data: DataRow[],
  columnIndex: number
): DataRow[] {
  const specs: DataRow[] = [];

  for (const row of data) {
    const key = Object.keys(row)[columnIndex];
    const value = row[key];
    if (value) {
      specs.push({ [key]: value });
    }
  }

  return specs;
}
