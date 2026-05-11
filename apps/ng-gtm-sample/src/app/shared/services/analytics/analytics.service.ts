import { computed, Injectable, signal } from '@angular/core';
import { AnalyticsEventTrackerFactory } from './analytics-factory';
import { of, take, tap, from, defer } from 'rxjs';
import { Order } from '../../models/order.model';
import { JavascriptInterfaceService } from '../javascript-interface/javascript-interface.service';
import { v4 as uuidv4 } from 'uuid';
import { DataLayerEvent } from '../../models/data-layer-event.model';
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private readonly checkoutOrders = signal<Order[]>([]);
  readonly checkoutOrders$ = computed(() => this.checkoutOrders());
  private db: any;

  constructor(
    private readonly analyticsEventTrackerFactory: AnalyticsEventTrackerFactory,
    private readonly javascriptInterfaceService: JavascriptInterfaceService
  ) {
    this.loadInitialData();
    this.initializeIndexedDB()
      .pipe(
        tap(() => {
          if (this.db) {
            (globalThis as any).dataLayer = (globalThis as any).dataLayer || [];
            globalThis.addEventListener('online', () =>
              this.syncDataLayerEvents()
            );
          }
        })
      )
      .subscribe();
  }

  private initializeIndexedDB() {
    return defer(() => {
      return from(import('../../../db')).pipe(
        take(1),
        tap((module) => {
          this.db = module.db;
        })
      );
    });
  }

  saveDataLayerEvent(eventName: string, eventData: any) {
    if (!eventName || !eventData) return of('');
    if (globalThis.navigator?.onLine) {
      // Push directly to dataLayer when online
      (globalThis as any).dataLayer = (globalThis as any).dataLayer || [];

      // ecommerce events require a different dataLayer structure
      if (eventData.ecommerce) {
        (globalThis as any).dataLayer.push(
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
      (globalThis as any).dataLayer.push({ event: eventName, ...eventData });
      this.javascriptInterfaceService.logEvent(eventName, eventData);
      return of('');
    } else {
      // Save to IndexedDB when offline
      const id = uuidv4();
      const timestamp = Date.now();
      const event: DataLayerEvent = { id, eventName, eventData, timestamp };
      return from(this.db.events.add(event)).pipe(
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

  trackEvent(eventName: string, eventData: any) {
    try {
      const eventTracker =
        this.analyticsEventTrackerFactory.createEvent(eventName);
      const data = eventTracker.getProcessedData(eventData);
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
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    this.checkoutOrders.set(orders);
  }
}
