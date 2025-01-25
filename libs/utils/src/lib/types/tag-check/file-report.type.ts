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
  id: number;
  eventId: string;
  dataLayer: string;
  dataLayerSpec: string;
};

export type ImageSchema = {
  id: number;
  eventId: string;
  imageName: string;
  imageData: Uint8Array;
  imageSize: number;
  createdAt: Date;
};
