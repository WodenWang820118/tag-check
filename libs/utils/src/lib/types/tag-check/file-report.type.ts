import { Auditable } from './auditable.type';
import { TestEvent } from './project.type';
import { TestEventDetailSchema } from './report.type';

export type FrontFileReport = {
  fileName: string;
  testEventDetails: TestEventDetailSchema[]; // for retrieving the created date
  testImage: TestImage[];
} & TestEvent &
  Auditable;

export type FileReport = {
  fileName: string;
};

export type FileReportSchema = {
  id: number;
} & FileReport &
  Auditable;

export type DataLayerResult = {
  eventId: string;
  dataLayer?: string;
  dataLayerSpec: string;
};

export type DataLayerSchema = {
  id: number;
  createdAt: Date;
} & DataLayerResult;

export type ImageResult = {
  eventId: string;
  imageName: string;
  imageData: Uint8Array;
  imageSize: number;
};

export type ImageSchema = {
  id: number;
  createdAt: Date;
} & ImageResult;

export type TestImage = {
  imageName: string;
  imageData: Uint8Array;
  imageSize?: number;
};

export type TestImageSchema = {
  id: number;
  createdAt: Date;
} & Auditable;
