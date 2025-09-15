import { Injectable } from '@angular/core';
import { AbstractTestEvent, IReportDetails } from '@utils';

@Injectable({ providedIn: 'root' })
export class ReportMapperService {
  toReportDetails(items: AbstractTestEvent[]): IReportDetails[] {
    return items.map((e, idx) => {
      const d = e.latestTestEventDetail;
      let updatedAt: Date;
      if (e.updatedAt) {
        updatedAt = new Date(e.updatedAt);
      } else if (d?.updatedAt) {
        updatedAt = new Date(d.updatedAt);
      } else {
        updatedAt = new Date();
      }

      return {
        // Fields required by IReportDetails but absent in AbstractTestEvent
        position: idx + 1,
        event: e.eventName,
        // TestEvent fields
        eventName: e.eventName,
        testName: e.testName,
        eventId: e.eventId,
        stopNavigation: e.stopNavigation,
        message: e.message,
        // TestEventDetail fields from latestTestEventDetail
        passed: d?.passed ?? false,
        requestPassed: d?.requestPassed ?? false,
        rawRequest: d?.rawRequest,
        destinationUrl: d?.destinationUrl ?? '',
        dataLayer: d?.dataLayer,
        // Auditable
        createdAt: e.createdAt ? new Date(e.createdAt) : new Date(),
        updatedAt: updatedAt
      } as IReportDetails;
    });
  }
}
