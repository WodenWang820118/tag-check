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
export class IndexeddbFeaturedDestinationService {
  private readonly dbReady$ = defer(() =>
    from(import('../../../db-destinations')).pipe(
      take(1),
      tap(() => {
        console.log('IndexedDB initialized');
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

  getAllFeaturedDestinations(): Observable<Destination[]> {
    return this.dbReady$.pipe(
      switchMap(
        (db) =>
          db.getFeaturedDestinations() as unknown as Observable<Destination[]>
      )
    );
  }

  addFeaturedDestinations(destinations: Destination[]): Observable<string[]> {
    return this.dbReady$.pipe(
      take(1),
      switchMap(
        (db) => db.addFeaturedDestinations(destinations) as Observable<string[]>
      )
    );
  }

  replaceFeaturedDestinations(
    destinations: Destination[]
  ): Observable<string[]> {
    return this.dbReady$.pipe(
      take(1),
      switchMap(
        (db) =>
          db.replaceFeaturedDestinations(destinations) as Observable<string[]>
      )
    );
  }

  upsertFeaturedDestination(destination: Destination): Observable<string> {
    return this.dbReady$.pipe(
      take(1),
      switchMap(
        (db) => db.addFeaturedDestination(destination) as Observable<string>
      )
    );
  }

  clearFeaturedDestinations(): Observable<void> {
    return this.dbReady$.pipe(
      take(1),
      switchMap((db) => db.clearFeaturedDestinations() as Observable<void>)
    );
  }
}
