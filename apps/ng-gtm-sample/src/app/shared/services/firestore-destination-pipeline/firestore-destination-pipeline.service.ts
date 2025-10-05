import { computed, Injectable, signal } from '@angular/core';
import { firestore } from '../../../firebase/firestore';
import {
  collection,
  DocumentData,
  getDocs,
  limit,
  orderBy,
  query,
  QueryDocumentSnapshot,
  QuerySnapshot,
  startAfter,
  startAt,
  where,
} from 'firebase/firestore';
import {
  of,
  defer,
  from,
  tap,
  forkJoin,
  map,
  switchMap,
  Observable,
  take,
  combineLatest,
  catchError,
} from 'rxjs';
import { FirebaseStorageService } from '../firebase-storage/firebase-storage.service';
import { Destination } from '../../models/destination.model';
import { IndexeddbFeaturedDestinationService } from '../indexeddb-featured-destination/indexeddb-featured-destination.service';
import { IndexeddbDestinationService } from '../indexeddb-destination/indexeddb-destination.service';

@Injectable({
  providedIn: 'root',
})
export class FirestoreDestinationPipelineService {
  private readonly lastVisibleDocs = signal<QueryDocumentSnapshot<
    DocumentData,
    DocumentData
  > | null>(null);
  readonly lastVisibleDocs$ = computed(() => this.lastVisibleDocs());
  previousDocsStack: QueryDocumentSnapshot<DocumentData, DocumentData>[] = [];
  db: any;

  constructor(
    private readonly firebaseStorageService: FirebaseStorageService,
    private readonly indexeddbFeaturedDestinationService: IndexeddbFeaturedDestinationService,
    private readonly indexeddbDestinationService: IndexeddbDestinationService
  ) {}

  getAllDestinationsData(): Observable<Destination[]> {
    return combineLatest([
      this.indexeddbDestinationService.getAllDestinations(),
      this.indexeddbFeaturedDestinationService.getAllFeaturedDestinations(),
    ]).pipe(
      switchMap(([destinations, featuredDestinations]) => {
        if (destinations.length > 0) {
          return of(destinations.concat(featuredDestinations));
        } else {
          return forkJoin({
            regularDestinations: this.fetchDestinations(() =>
              this.getAllDestinations()
            ),
            featuredDestinations: this.fetchDestinations(() =>
              this.getAllFeaturedDestinations()
            ),
          }).pipe(
            map(({ regularDestinations, featuredDestinations }) => {
              console.log('Fetched destinations from Firestore');
              console.log('Regular destinations:', regularDestinations);
              console.log('Featured destinations:', featuredDestinations);
              const allDestinations =
                regularDestinations.concat(featuredDestinations);

              if (regularDestinations.length > 0) {
                this.indexeddbDestinationService
                  .addDestinations(regularDestinations)
                  .pipe(
                    take(1),
                    tap(() =>
                      console.log('Added regular destinations to IndexedDB')
                    )
                  )
                  .subscribe();
              }

              if (featuredDestinations.length > 0) {
                this.indexeddbFeaturedDestinationService
                  .addFeaturedDestinations(featuredDestinations)
                  .pipe(
                    take(1),
                    tap(() =>
                      console.log('Added featured destinations to IndexedDB')
                    )
                  )
                  .subscribe();
              }

              return allDestinations;
            }),
            catchError((error) => {
              console.error('Error fetching destinations', error);
              return of([]);
            })
          );
        }
      })
    );
  }

  // TODO: cache the data locally
  getFirstDestinationsData(queryLimit = 5) {
    return this.fetchDestinations(() => this.getFirstDestinations(queryLimit));
  }

  getNextDestinationsData(queryLimit = 5) {
    return this.fetchDestinations(() => this.getNextDestinations(queryLimit));
  }

  getPreviousDestinationsData() {
    return this.fetchDestinations(() => this.getPreviousDestinations());
  }

  getSearchResultsData(searchQuery: string, queryLimit = 5) {
    return this.fetchDestinations(() =>
      this.getSearchResults(searchQuery, queryLimit)
    );
  }

  private getAllDestinations() {
    // it gets the very first country, Afghanistan with all its cities
    return defer(() =>
      from(
        getDocs(
          query(
            collection(firestore, 'destinations'),
            where('country', '==', 'Afghanistan'),
            orderBy('country')
          )
        )
      )
    );
  }

  private getAllFeaturedDestinations() {
    return defer(() =>
      from(getDocs(query(collection(firestore, 'countries'))))
    );
  }

  private getFirstDestinations(queryLimit = 5) {
    return defer(() =>
      from(
        getDocs(
          query(
            collection(firestore, 'destinations'),
            orderBy('country'),
            limit(queryLimit)
          )
        )
      ).pipe(
        tap((documentSnapshots) => {
          const lastVisible =
            documentSnapshots.docs[documentSnapshots.docs.length - 1];
          this.previousDocsStack = [lastVisible];
          this.lastVisibleDocs.set(lastVisible);
        })
      )
    );
  }

  private getNextDestinations(queryLimit = 5) {
    return defer(() => {
      const lastVisible = this.lastVisibleDocs$();
      if (!lastVisible) {
        return of({} as QuerySnapshot<DocumentData, DocumentData>);
      }
      return from(
        getDocs(
          query(
            collection(firestore, 'destinations'),
            orderBy('country'),
            startAfter(lastVisible),
            limit(queryLimit)
          )
        )
      ).pipe(
        tap((documentSnapshots) => {
          const lastVisible =
            documentSnapshots.docs[documentSnapshots.docs.length - 1];
          this.previousDocsStack.push(lastVisible);
          this.lastVisibleDocs.set(lastVisible);
        })
      );
    });
  }

  private getPreviousDestinations() {
    return defer(() => {
      if (this.previousDocsStack.length < 2) {
        return of({} as QuerySnapshot<DocumentData, DocumentData>);
      }
      // Remove the current last visible document
      this.previousDocsStack.pop();
      const previousLastVisible =
        this.previousDocsStack[this.previousDocsStack.length - 1];
      return from(
        getDocs(
          query(
            collection(firestore, 'destinations'),
            orderBy('country'),
            startAt(previousLastVisible),
            limit(2)
          )
        )
      ).pipe(
        tap((documentSnapshots) => {
          const lastVisible =
            documentSnapshots.docs[documentSnapshots.docs.length - 1];
          this.lastVisibleDocs.set(lastVisible);
        })
      );
    });
  }

  private getSearchResults(searchQuery: string, queryLimit = 2) {
    const endTerm = searchQuery + '\uf8ff';
    return defer(() =>
      from(
        getDocs(
          query(
            collection(firestore, 'destinations'),
            where('country', '>=', searchQuery),
            where('country', '<=', endTerm),
            limit(queryLimit)
          )
        )
      ).pipe(
        tap((documentSnapshots) => {
          const lastVisible =
            documentSnapshots.docs[documentSnapshots.docs.length - 1];
          this.previousDocsStack = [lastVisible];
          this.lastVisibleDocs.set(lastVisible);
        })
      )
    );
  }

  private fetchDestinations(
    fetchMethod: () => Observable<QuerySnapshot<DocumentData, DocumentData>>
  ): Observable<Destination[]> {
    return fetchMethod().pipe(
      switchMap((documents) => {
        const data = documents.docs.map((doc) => {
          return { ...doc.data(), id: doc.id };
        }) as Destination[];
        const destinationObservables = data.map((document) => {
          console.log('Fetching images for document:', document);
          return forkJoin({
            image1: this.firebaseStorageService.getImage(document['image1']),
            image2: this.firebaseStorageService.getImage(document['image2']),
            image3: this.firebaseStorageService.getImage(document['image3']),
            imageBig: this.firebaseStorageService.getImage(
              document['imageBig']
            ),
          }).pipe(
            map((images) => ({
              ...document,
              ...images,
            }))
          );
        });
        return forkJoin(destinationObservables);
      })
    );
  }

  getPreviousDocsStackLength() {
    return this.previousDocsStack.length;
  }

  getPreviousDocsStack() {
    return this.previousDocsStack;
  }
}
