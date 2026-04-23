import { computed, Injectable, signal } from '@angular/core';
import {
  defer,
  from,
  map,
  Observable,
  shareReplay,
  switchMap,
  take,
  tap
} from 'rxjs';
import { Destination } from '../../models/destination.model';

@Injectable({
  providedIn: 'root',
})
export class IndexeddbDestinationService {
  private readonly dbReady$ = defer(() =>
    from(import('../../../db-destinations')).pipe(
      take(1),
      tap((module) => {
        console.log('IndexedDB: regular destinations initialized');
        this.dbInitialized.set(true);
      }),
      map((module) => module.db),
      shareReplay(1)
    )
  );
  private readonly dbInitialized = signal<boolean>(false);
  readonly dbInitialized$ = computed(() => this.dbInitialized());

  constructor() {
    this.dbReady$.pipe(take(1)).subscribe();
  }

  getAllDestinations() {
    return this.dbReady$.pipe(
      switchMap(
        (db) =>
          db.getDestinations() as unknown as Observable<Destination[]>
      )
    );
  }

  addDestinations(destinations: Destination[]): Observable<string[]> {
    return this.dbReady$.pipe(
      take(1),
      switchMap((db) => {
        console.log('Adding destinations to IndexedDB: ', destinations);
        return db.addDestinations(destinations) as Observable<string[]>;
      })
    );
  }

  replaceDestinations(destinations: Destination[]): Observable<string[]> {
    return this.dbReady$.pipe(
      take(1),
      switchMap(
        (db) => db.replaceDestinations(destinations) as Observable<string[]>
      )
    );
  }

  upsertDestination(destination: Destination): Observable<string> {
    return this.dbReady$.pipe(
      take(1),
      switchMap((db) => db.addDestination(destination) as Observable<string>)
    );
  }

  clearDestinations(): Observable<void> {
    return this.dbReady$.pipe(
      take(1),
      switchMap((db) => db.clearDestinations() as Observable<void>)
    );
  }
}
