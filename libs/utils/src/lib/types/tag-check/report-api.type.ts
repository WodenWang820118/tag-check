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

/** Body of GET /reports/:projectSlug/:eventId. */
export type ReportDetailResponse = {
  testEvent: AbstractTestEvent;
  /** The latest run's result, or null before the first run. */
  testEventDetails: TestEventDetailSchema | null;
  /** The latest run's screenshot, or null before the first run. */
  testImage: TestImageSummary | null;
};
