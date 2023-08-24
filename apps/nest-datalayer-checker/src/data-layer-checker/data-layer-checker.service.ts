import { Observable, map, tap } from 'rxjs';
import { Injectable } from '@nestjs/common';
import { AirtableService } from '../airtable/airtable.service';
import { chunk } from '../utilities/utilities';
import { WebAgentService } from '../web-agent/web-agent.service';

/**
 * DataLayerCheckerService
 * A service class to check the data layer; update records with the examination results.
 */
@Injectable()
export class DataLayerCheckerService {
  constructor(
    private readonly airtableService: AirtableService,
    private readonly webAgentService: WebAgentService,
  ) {}

  /**
   * Match the dataLayer specs keys with the actual dataLayer keys, and validate the values.
   * It will return true if the dataLayer matches the specs, otherwise false.
   * @param {Object} specData - The expected dataLayer specification
   * @param {Array<Object>} data - The actual dataLayer
   * @returns boolean
   */
  validateDataLayerWithSpecs(specData: object, data: Array<object>): boolean {
    const specs = Object.keys(specData);
    const matchingDataObj = data.find(ele =>
      Object.keys(ele).some(key => specs.includes(key)),
    );

    return matchingDataObj
      ? this.validateSchema(specData, matchingDataObj)
      : false;
  }

  /**
   * Compare the specs object with the data object, and return true if the data object matches the specs object, otherwise false.
   * @param {Object} specObj - The expected data specification
   * @param {Object} dataObj - The actual data
   * @returns boolean
   */
  validateSchema(specObj: any, dataObj: object): boolean {
    // When both are primitive types (e.g. string, number)
    if (typeof specObj !== 'object' || specObj === null) {
      return specObj === dataObj;
    }

    // Handle the array scenario
    if (Array.isArray(specObj)) {
      if (!Array.isArray(dataObj) || specObj.length !== dataObj.length) {
        return false;
      }
      for (let i = 0; i < specObj.length; i++) {
        if (!this.validateSchema(specObj[i], dataObj[i])) {
          return false;
        }
      }
      return true;
    }

    // Handle the object scenario
    const specKeys = Object.keys(specObj);
    const dataKeys = Object.keys(dataObj);

    // Ensure every key in specObj is present in dataObj
    for (let key of specKeys) {
      if (!dataKeys.includes(key)) {
        return false;
      }

      // Recursively validate nested objects or arrays
      if (!this.validateSchema(specObj[key], dataObj[key])) {
        return false;
      }
    }

    return true;
  }

  // ---------------------- airtable-related methods ----------------------

  /**
   * Examine the results with the Airtable records
   * @param records Airtable records
   * @param fieldName Airtable field name
   * @returns Observable<Promise<any[]>> of the examined results
   */
  examineResults(records: Observable<any[]>, fieldName: string) {
    return records.pipe(
      map(async records => {
        for (const record of records) {
          // two cases: 1. operation 2. url
          if (
            !record.fields['Recording'] &&
            !record.fields['Code Specs'] &&
            !record.fields['URL']
          ) {
            record.fields[`${fieldName}`] = false.toString();
          } else {
            await this.handleRecordByType(record, fieldName);
          }
        }
        return records;
      }),
    );
  }

  private async handleRecordByType(record: any, fieldName: string) {
    let actualDataLayer;
    let result;
    try {
      // if there is a recording, use the recording to get the data layer
      if (record.fields['Recording']) {
        actualDataLayer = await this.webAgentService.executeAndGetDataLayer(
          JSON.parse(record.fields['Recording']),
          '',
          '',
          '',
        );
      } else if (record.fields['URL']) {
        // if there is a URL to get dataLayer directly, use the URL to get the data layer
        actualDataLayer = await this.webAgentService.fetchDataLayer(
          record.fields['URL'],
        );
      }
      // if there is a code specs, use the code specs to examine the data layer
      result = this.validateDataLayerWithSpecs(
        JSON.parse(record.fields['Code Specs']),
        actualDataLayer,
      );
    } catch (error) {
      console.error('Error processing record:', error);
      result = false;
    }
    record.fields[`${fieldName}`] = result.toString();
  }

  /**
   * Check the code specs and update the Airtable Records
   * @param {string} baseId - the base ID for the Airtable API
   * @param {string} tableId - the table ID for the Airtable API
   * @param {string} fieldName - the field name to update {Code Spec Match
   * @param {string} token - the API token for the Airtable API
   * @returns void
   */
  checkCodeSpecsAndUpdateRecords(
    baseId: string,
    tableId: string,
    fieldName: string,
    token: string,
  ) {
    const records: Observable<any> = this.airtableService.getRecords(
      baseId,
      tableId,
      token,
    );
    const examineResults = this.examineResults(
      records.pipe(
        map(
          (response: { data: { records: object[] } }) => response.data.records,
        ),
      ),
      fieldName,
    );
    examineResults
      .pipe(
        tap(async results => {
          // console.log('results: ', results);
          // If there are no records, return an error
          if (!results) {
            return Error('No records found');
          }

          // Split the results into batches of 10
          const batches = chunk(await results, 10);

          // Update the records in batches
          for (const batch of batches) {
            this.airtableService
              .updateCodeSpecRecords(baseId, tableId, batch, fieldName, token)
              .subscribe(res => {
                console.log('res: ', res.status);
              });
          }
        }),
      )
      .subscribe();
  }
}
