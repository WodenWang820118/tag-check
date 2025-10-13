import { computed, Injectable, signal } from '@angular/core';
import { defer, from, Observable, of, take, tap } from 'rxjs';
import { Destination } from '../../models/destination.model';

@Injectable({
  providedIn: 'root',
})
export class IndexeddbFeaturedDestinationService {
  db: any;
  // private dbInitialized = new BehaviorSubject<boolean>(false);
  private readonly dbInitialized = signal<boolean>(false);
  readonly dbInitialized$ = computed(() => this.dbInitialized());

  constructor() {
    this.initializeIndexedDB()
      .pipe(
        take(1),
        tap(() => {
          console.log('IndexedDB initialized');
          this.dbInitialized.set(true);
        })
      )
      .subscribe();
  }
  private initializeIndexedDB() {
    return defer(() => {
      return from(import('../../../db-destinations')).pipe(
        take(1),
        tap((module) => {
          this.db = module.db;
        })
      );
    });
  }

  getAllFeaturedDestinations(): Observable<Destination[]> {
    const dbInitialized = this.dbInitialized$();
    if (dbInitialized) {
      return this.db.getFeaturedDestinations() as Observable<Destination[]>;
    }
    return of([]);
  }

  addFeaturedDestinations(destinations: Destination[]): Observable<string[]> {
    const dbInitialized = this.dbInitialized$();
    if (dbInitialized) {
      return this.db.addFeaturedDestinations(destinations) as Observable<
        string[]
      >;
    }
    return of([]);
  }
}
