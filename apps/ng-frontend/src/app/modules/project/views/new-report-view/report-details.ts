export class ReportDetails {
  position = 0;
  eventName: string;
  passed = false;
  dataLayerSpec: string;
  incorrectInfo = [];
  completedTime = new Date();
  dataLayer = {};
  message = '';

  constructor(eventName: string) {
    this.eventName = eventName;
    this.dataLayerSpec = eventName;
  }
}
