import { JavascriptInterfaceService } from './shared/services/javascript-interface/javascript-interface.service';
import { EnvDetectorService } from './shared/services/env-detector/env-detector.service';
import Dexie, { Table, liveQuery } from 'dexie';
import { from, take, tap } from 'rxjs';
import { DataLayerEvent } from './shared/models/data-layer-event.model';

export class DataLayerDatabase extends Dexie {
  events!: Table<DataLayerEvent, string>;
  javascriptInterfaceService: JavascriptInterfaceService;
  envDetectorService: EnvDetectorService;
  constructor() {
    super('ng-gtm-integration');
    this.version(3).stores({
      events: '++id, eventName'
    });
    this.envDetectorService = new EnvDetectorService();
    this.javascriptInterfaceService = new JavascriptInterfaceService(
      this.envDetectorService
    );
  }

  getEvents() {
    return liveQuery(() => {
      console.log('Getting events from IndexedDB');
      return this.events.toArray();
    });
  }

  clearEvents() {
    return from(this.events.clear());
  }

  syncDataLayerEvents() {
    return from(this.getEvents()).pipe(
      take(1),
      tap((events) => {
        events.forEach((event) => {
          if (!event.eventName || !event.eventData) return;
          console.log('Syncing ecommerce from IndexedDB', event);
          (globalThis as any).dataLayer.push({ ecommerce: null }); // Clear the previous ecommerce object (if any
          (globalThis as any).dataLayer.push({
            event: event.eventName,
            ...event.eventData
          });
          this.javascriptInterfaceService.logEvent(
            event.eventName,
            event.eventData
          );
        });
        this.clearEvents()
          .pipe(
            take(1),
            tap(() => {
              console.log('Events cleared from IndexedDB');
            })
          )
          .subscribe();
      })
    );
  }
}

export const db = new DataLayerDatabase();
