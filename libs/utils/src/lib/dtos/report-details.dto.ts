import {
  BaseDataLayerEvent,
  OutputValidationResult,
  StrictDataLayerEvent
} from '../types/tag-check';

/**
 * The outcome of one run: both check results, the captured data layer, the
 * raw GA4 request and the screenshot. Fields left out of the constructor
 * argument keep the defaults of a run that has not passed.
 */
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
  rawRequest = '';
  message = '';
  destinationUrl = '';
  createdAt: Date = new Date();
  id!: number;
  imageName!: string;
  imageData!: Uint8Array;
  imageSize!: number;
  updatedAt?: Date;

  constructor(report: Partial<ReportDetailsDto>) {
    Object.assign(this, report);
  }
}
