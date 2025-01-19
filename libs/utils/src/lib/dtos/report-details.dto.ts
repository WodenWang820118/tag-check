import { BaseDataLayerEvent, StrictDataLayerEvent } from '../types/tag-check';

export class ReportDetailsDto {
  position = 0;
  eventId: string;
  testName: string;
  eventName: string;
  passed = false;
  requestPassed = false;
  incorrectInfo = '';
  completedTime = new Date();
  dataLayerSpec = {} as BaseDataLayerEvent | StrictDataLayerEvent;
  dataLayer = {} as BaseDataLayerEvent | StrictDataLayerEvent;
  reformedDataLayer = {} as BaseDataLayerEvent | StrictDataLayerEvent;
  rawRequest = '';
  message = '';
  destinationUrl = '';

  constructor(eventId: string, testName: string, eventName: string) {
    this.eventId = eventId;
    this.testName = testName;
    this.eventName = eventName;
  }
}
