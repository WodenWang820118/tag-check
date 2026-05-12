import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  Injectable,
  PLATFORM_ID,
  inject,
  signal
} from '@angular/core';
import { AnalyticsEventTrackerFactory } from './analytics-factory';
import { Observable, defer, from, of, take, tap } from 'rxjs';
import { Order } from '../../models/order.model';
import { JavascriptInterfaceService } from '../javascript-interface/javascript-interface.service';
import { v4 as uuidv4 } from 'uuid';
import { DataLayerEvent } from '../../models/data-layer-event.model';

type DataLayerEntry = Record<string, unknown>;
type AnalyticsEventData = Record<string, unknown>;
type AnalyticsDatabase = {
  events: {
    add(event: DataLayerEvent): Promise<unknown>;
  };
  syncDataLayerEvents(): Observable<unknown>;
};

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly checkoutOrders = signal<Order[]>([]);
  readonly checkoutOrders$ = computed(() => this.checkoutOrders());
  private db: AnalyticsDatabase | null = null;

  constructor(
    private readonly analyticsEventTrackerFactory: AnalyticsEventTrackerFactory,
    private readonly javascriptInterfaceService: JavascriptInterfaceService
  ) {
    this.loadInitialData();

    if (this.browser) {
      this.initializeIndexedDB()
        .pipe(
          tap(() => {
            if (this.db) {
              this.getDataLayer();
              globalThis.addEventListener('online', () =>
                this.syncDataLayerEvents()
              );
            }
          })
        )
        .subscribe();
    }
  }

  private initializeIndexedDB(): Observable<unknown> {
    if (!this.browser) {
      return of(null);
    }

    return defer(() =>
      from(
        import('../../../db').then((module) => {
          this.db = module.db;
          return module.db;
        })
      )
    ).pipe(take(1));
  }

  saveDataLayerEvent(eventName: string, eventData: AnalyticsEventData) {
    if (!this.browser || !eventName || !eventData) return of('');
    if (globalThis.navigator?.onLine) {
      // Push directly to dataLayer when online
      const dataLayer = this.getDataLayer();

      // ecommerce events require a different dataLayer structure
      if (eventData.ecommerce) {
        dataLayer.push(
          { ecommerce: null },
          {
            event: eventName,
            ...eventData
          }
        );
        this.javascriptInterfaceService.logEvent(eventName, eventData);
        return of('');
      }
      // all other events
      dataLayer.push({
        event: eventName,
        ...eventData
      });
      this.javascriptInterfaceService.logEvent(eventName, eventData);
      return of('');
    } else {
      // Save to IndexedDB when offline
      const id = uuidv4();
      const timestamp = Date.now();
      const event: DataLayerEvent = { id, eventName, eventData, timestamp };
      return from(this.db?.events.add(event) ?? Promise.resolve('')).pipe(
        tap(() => {
          console.log('Event saved to IndexedDB');
        })
      );
    }
  }

  private syncDataLayerEvents() {
    console.log('Syncing events from IndexedDB');
    this.db.syncDataLayerEvents().subscribe();
  }

  trackEvent(eventName: string, eventData: unknown) {
    try {
      const eventTracker =
        this.analyticsEventTrackerFactory.createEvent(eventName);
      const data = eventTracker.getProcessedData(eventData) as {
        eventData: AnalyticsEventData;
      };
      this.saveDataLayerEvent(eventName, data.eventData).subscribe();
    } catch (error) {
      console.error('Error tracking event:', error);
      console.log('Event not tracked:', eventName, eventData);
    }
  }

  setCheckoutOrders(orders: Order[]): void {
    this.checkoutOrders.set(orders);
  }

  private loadInitialData(): void {
    if (!this.browser) {
      this.checkoutOrders.set([]);
      return;
    }

    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    this.checkoutOrders.set(orders);
  }

  private getDataLayer(): DataLayerEntry[] {
    const scope = globalThis as unknown as {
      dataLayer?: DataLayerEntry[];
    };
    scope.dataLayer ??= [];
    return scope.dataLayer;
  }
}
