import {
  BaseDataLayerEvent,
  OutputValidationResult,
  StrictDataLayerEvent
} from '../types/tag-check';

export class ReportDetailsDto implements OutputValidationResult {
  position = 0;
  eventId!: string;
  testName!: string;
  eventName!: string;
  event!: string;
  passed = false;
  requestPassed = false;
  completedTime = new Date();
  dataLayerSpec = {} as BaseDataLayerEvent | StrictDataLayerEvent;
  dataLayer = [] as (BaseDataLayerEvent | StrictDataLayerEvent)[];
  reformedDataLayer = [] as (BaseDataLayerEvent | StrictDataLayerEvent)[];
  rawRequest = '';
  message = '';
  destinationUrl = '';
  createdAt: Date = new Date();
  id!: number;
  imageName!: string;
  imageData!: any; // should be the image buffer data
  imageSize!: number;

  constructor(report: Partial<OutputValidationResult>) {
    Object.assign(this, report);
  }
}
