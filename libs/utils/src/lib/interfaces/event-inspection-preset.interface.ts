import { Application } from './setting.interface';

export interface EventInspectionPreset {
  application: Application;
  puppeteerArgs: string[];
}
