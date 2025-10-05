import { computed, Injectable, signal } from '@angular/core';
import { defer, from, Observable, of, take, tap } from 'rxjs';
import { Destination } from '../../models/destination.model';

@Injectable({
  providedIn: 'root',
})
export class IndexeddbDestinationService {
  db: any;
  private readonly dbInitialized = signal<boolean>(false);
  readonly dbInitialized$ = computed(() => this.dbInitialized());

  constructor() {
    this.initializeIndexedDB()
      .pipe(
        take(1),
        tap(() => {
          console.log('IndexedDB: regular destinations initialized');
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

  getAllDestinations() {
    const dbInitialized = this.dbInitialized$();
    if (dbInitialized) {
      return this.db.getDestinations() as Observable<Destination[]>;
    }
    return of([]);
  }

  addDestinations(destinations: Destination[]): Observable<string[]> {
    const dbInitialized = this.dbInitialized$();
    if (dbInitialized) {
      console.log('Adding destinations to IndexedDB: ', destinations);
      return this.db.addDestinations(destinations) as Observable<string[]>;
    }
    return of([]);
  }
}
