import { Auditable } from './auditable.type';
import { AbstractTestEvent } from './project.type';
import { TestEventDetailSchema } from './report.type';

/**
 * A run's screenshot without its bytes. GET /projects/images/:projectSlug/:eventId
 * serves the image itself.
 */
export type TestImageSummary = {
  id: number;
  imageName: string;
  imageSize?: number;
} & Auditable;

/**
 * A type as it arrives over HTTP: JSON turns dates into ISO strings. Use it
 * for recorded responses; the backend types keep Date.
 */
export type Jsonified<T> = T extends Date
  ? string
  : T extends (infer Item)[]
    ? Jsonified<Item>[]
    : T extends object
      ? { [Key in keyof T]: Jsonified<T[Key]> }
      : T;

/**
 * Body of GET /reports/:projectSlug/:eventId, and of each item the run
 * endpoints (POST /datalayer/...) return.
 */
export type ReportDetailResponse = {
  testEvent: AbstractTestEvent;
  /** The latest run's result, or null before the first run. */
  testEventDetails: TestEventDetailSchema | null;
  /** The latest run's screenshot, or null before the first run. */
  testImage: TestImageSummary | null;
};
