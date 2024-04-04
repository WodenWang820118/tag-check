export class ReportDetails {
  position = 0;
  eventName: string;
  passed = false;
  requestPassed = false;
  dataLayerSpec: string;
  incorrectInfo = [];
  completedTime = new Date();
  dataLayer = {};
  reformedDataLayer = {};
  rawRequest = '';
  message = '';

  constructor(eventName: string) {
    this.eventName = eventName;
    this.dataLayerSpec = eventName;
  }
}
