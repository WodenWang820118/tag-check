import { describe, expect, it } from 'vitest';
import {
  getGa4MeasurementPlanTemplateRows,
  parseMeasurementPlanRows
} from '@utils';
import {
  buildExtractedMeasurementPlanCsv,
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

  it('writes an extracted plan with notes that the plan upload reads back', () => {
    const csv = buildExtractedMeasurementPlanCsv([
      {
        eventName: 'add_to_cart',
        eventParameters: ['value', 'currency'],
        itemParameters: ['item_id', 'item_name'],
        notes: ['Item parameters are not in the container; add the others.']
      }
    ]);
    const table = parseCsvToTable(csv);
    expect(table).toEqual([
      ['event_name', 'event_parameters', 'item_parameters', 'notes'],
      [
        'add_to_cart',
        'value, currency',
        'item_id, item_name',
        'Item parameters are not in the container; add the others.'
      ]
    ]);
    expect(parseMeasurementPlanRows(table)).toEqual({
      rows: [
        {
          eventName: 'add_to_cart',
          eventParameters: ['value', 'currency'],
          itemParameters: ['item_id', 'item_name']
        }
      ],
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

  it('supports RFC 4180 quoted cells containing line breaks as Excel writes them', () => {
    const csv =
      'dataLayer Specs\r\n' +
      '"window.dataLayer.push({\r\n  event: \'view_item\'\r\n});"\r\n';

    expect(parseCsvToTable(csv)).toEqual([
      ['dataLayer Specs'],
      ["window.dataLayer.push({\r\n  event: 'view_item'\r\n});"]
    ]);
  });

  it('handles doubled quotes within multi-line cells', () => {
    const csv =
      'dataLayer Specs\r\n' +
      '"window.dataLayer.push({\r\n  ""event"": ""view_item""\r\n});"\r\n';

    expect(parseCsvToTable(csv)).toEqual([
      ['dataLayer Specs'],
      ['window.dataLayer.push({\r\n  "event": "view_item"\r\n});']
    ]);
  });

  it('supports semicolon delimiter with multi-line quoted cells and doubled quotes', () => {
    const csv =
      'dataLayer Specs;Notes\r\n' +
      '"window.dataLayer.push({\r\n  event: \'add_to_cart\'\r\n});";"A ""quoted"" note"\r\n';

    expect(parseCsvToTable(csv)).toEqual([
      ['dataLayer Specs', 'Notes'],
      [
        "window.dataLayer.push({\r\n  event: 'add_to_cart'\r\n});",
        'A "quoted" note'
      ]
    ]);
  });

  it('skips blank lines and whitespace-only lines between multi-line records', () => {
    const csv =
      'dataLayer Specs\r\n\r\n' +
      '"window.dataLayer.push({\r\n  event: \'login\'\r\n});"\r\n   \r\n' +
      '"window.dataLayer.push({\r\n  event: \'sign_up\'\r\n});"\r\n\r\n';

    expect(parseCsvToTable(csv)).toEqual([
      ['dataLayer Specs'],
      ["window.dataLayer.push({\r\n  event: 'login'\r\n});"],
      ["window.dataLayer.push({\r\n  event: 'sign_up'\r\n});"]
    ]);
  });
});
