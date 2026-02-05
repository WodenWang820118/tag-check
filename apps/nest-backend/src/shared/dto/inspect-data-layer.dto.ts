import { ApplicationDto } from './event-inspection-preset.dto';
import { Credentials } from 'puppeteer';
import type { DataLayerSpec } from '@utils';

export class InspectDataLayerDto {
  measurementId?: string;
  credentials?: Credentials;
  captureRequest?: string;
  application!: ApplicationDto;
  spec!: DataLayerSpec;
}
