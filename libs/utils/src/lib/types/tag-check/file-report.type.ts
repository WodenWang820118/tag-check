export type FileReport = {
  id: number;
  projectSlug: string;
  eventId: string;
  testName: string;
  eventName: string;
  passed: boolean;
  requestPassed: boolean;
  rawRequest: string;
  message: string;
  destinationUrl: string;
  createdAt: Date;
};

export type DataLayerResult = {
  eventId: string;
  dataLayer: string;
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
