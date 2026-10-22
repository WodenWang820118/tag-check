import { describe, expect, it } from 'vitest';
import {
  getGa4MeasurementPlanTemplateRows,
  parseMeasurementPlanRows
} from '@utils';
import {
  buildMeasurementPlanTemplateCsv,
  parseCsvToTable,
  readMeasurementPlanFile
} from './measurement-plan-spreadsheet';

describe('measurement-plan-spreadsheet', () => {
  it('reads its own template back as the template rows, without issues', () => {
    const table = parseCsvToTable(buildMeasurementPlanTemplateCsv());

    expect(table[0]).toEqual([
      'event_name',
      'event_parameters',
      'item_parameters'
    ]);
    expect(parseMeasurementPlanRows(table)).toEqual({
      rows: getGa4MeasurementPlanTemplateRows(),
      issues: []
    });
  });

  it('keeps delimiters and doubled quotes inside quoted cells', () => {
    expect(parseCsvToTable('a,"b, c","say ""hi"""\r\n')).toEqual([
      ['a', 'b, c', 'say "hi"']
    ]);
  });

  it('reads the semicolon-separated CSV Excel saves in some locales', () => {
    const csv =
      '﻿event_name;event_parameters;item_parameters\n' +
      'add_to_cart;currency, value;item_id, price\n\n';

    expect(parseCsvToTable(csv)).toEqual([
      ['event_name', 'event_parameters', 'item_parameters'],
      ['add_to_cart', 'currency, value', 'item_id, price']
    ]);
  });

  it('reads an uploaded CSV file', async () => {
    const file = new File(
      ['event_name,event_parameters,item_parameters\nlogin,method,\n'],
      'plan.csv',
      { type: 'text/csv' }
    );

    expect(await readMeasurementPlanFile(file)).toEqual([
      ['event_name', 'event_parameters', 'item_parameters'],
      ['login', 'method', '']
    ]);
  });
});
