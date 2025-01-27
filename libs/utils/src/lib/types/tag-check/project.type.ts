import { FileReport } from './file-report.type';
import { Recording } from './recording.type';
import { EnvironmentSetting } from './setting.type';
import { Spec } from './spec.type';

export type ProjectInfo = {
  rootProject: string;
  projectName: string;
  projectSlug: string;
  projectDescription: string;
  measurementId: string;
  googleSpreadsheetLink: string;
  version: string;
};

export type ProjectSchema = {
  id: number;
  projectSlug: string;
  specs: Spec[];
  settings: EnvironmentSetting;
  recordings: Recording[];
  testResults: FileReport[];
  projectInfo: ProjectInfo;
};

export type Test = {
  testName: string;
  eventName: string;
  passed: boolean;
};

export type TestSchema = {
  id: number;
} & Test;

export type TestRequest = {
  requestPassed: boolean;
  rawRequest: string;
  destinationUrl: string;
};

export type TestRequestSchema = {
  id: number;
} & TestRequest;

export type TestEvent = {
  eventId: string;
  message: string;
};

export type TestEventSchema = {
  id: number;
} & TestEvent;
