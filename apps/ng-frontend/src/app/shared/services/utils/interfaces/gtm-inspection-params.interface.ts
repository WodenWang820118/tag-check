import { EventInspectionPreset } from '@utils';

export interface GtmInspectionParams {
  gtmUrl: string;
  headless?: boolean;
  eventInspectionPreset?: EventInspectionPreset;
  measurementId?: string;
  username?: string;
  password?: string;
  captureRequest?: boolean;
}
