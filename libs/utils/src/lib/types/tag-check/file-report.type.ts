import { Auditable } from './auditable.type';

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
