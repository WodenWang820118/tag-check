import { BaseDataLayerEvent, StrictDataLayerEvent } from '@utils';

export class ReportDetails {
  position = 0;
  eventName: string;
  passed = false;
  requestPassed = false;
  incorrectInfo = [];
  completedTime = new Date();
  dataLayerSpec = {} as BaseDataLayerEvent | StrictDataLayerEvent;
  dataLayer = {} as BaseDataLayerEvent | StrictDataLayerEvent;
  reformedDataLayer = {} as BaseDataLayerEvent | StrictDataLayerEvent;
  rawRequest = '';
  message = '';

  constructor(eventName: string) {
    this.eventName = eventName;
  }
}
