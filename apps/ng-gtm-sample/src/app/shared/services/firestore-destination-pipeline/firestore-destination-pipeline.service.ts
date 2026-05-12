import { computed, inject, Injectable, signal } from '@angular/core';
import {
  collection,
  DocumentData,
  endBefore,
  getDocs,
  limit,
  limitToLast,
  orderBy,
  query,
  QueryConstraint,
  QueryDocumentSnapshot,
  QuerySnapshot,
  startAfter,
  where
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
  catchError
} from 'rxjs';
import { FirebaseStorageService } from '../firebase-storage/firebase-storage.service';
import { Destination } from '../../models/destination.model';
import { IndexeddbDestinationService } from '../indexeddb-destination/indexeddb-destination.service';
import { FIREBASE_FIRESTORE } from '../../../firebase/firebase.tokens';

@Injectable()
export class FirestoreDestinationPipelineService {
  private readonly firstVisibleDocs = signal<QueryDocumentSnapshot<
    DocumentData,
    DocumentData
  > | null>(null);
  private readonly lastVisibleDocs = signal<QueryDocumentSnapshot<
    DocumentData,
    DocumentData
  > | null>(null);
  readonly lastVisibleDocs$ = computed(() => this.lastVisibleDocs());
  previousDocsStack: QueryDocumentSnapshot<DocumentData, DocumentData>[] = [];
  private currentQueryLimit = 5;
  private currentQueryBuilder: () => QueryConstraint[] = () => [
    orderBy('country')
  ];
  private readonly firestore = inject(FIREBASE_FIRESTORE);

  constructor(
    private readonly firebaseStorageService: FirebaseStorageService,
    private readonly indexeddbDestinationService: IndexeddbDestinationService
  ) {}

  getAllDestinationsData(): Observable<Destination[]> {
    return this.indexeddbDestinationService.getAllDestinations().pipe(
      switchMap((destinations) => {
        if (destinations.length > 0) {
          return of(destinations);
        } else {
          return this.refreshAllDestinationsCache().pipe(
            catchError((error) => {
              console.error('Error fetching destinations', error);
              return of([]);
            })
          );
        }
      })
    );
  }

  refreshAllDestinationsCache(): Observable<Destination[]> {
    return this.fetchDestinations(() => this.getAllDestinations()).pipe(
      switchMap((allDestinations) =>
        this.indexeddbDestinationService
          .replaceDestinations(allDestinations)
          .pipe(map(() => allDestinations))
      )
    );
  }

  // Optimization: consider caching the data locally with IndexedDB
  getFirstDestinationsData(queryLimit = 5) {
    this.currentQueryLimit = queryLimit;
    this.currentQueryBuilder = () => [orderBy('country')];
    return this.fetchDestinations(() => this.getFirstDestinations(queryLimit));
  }

  getNextDestinationsData(queryLimit = 5) {
    this.currentQueryLimit = queryLimit;
    return this.fetchDestinations(() => this.getNextDestinations(queryLimit));
  }

  getPreviousDestinationsData() {
    return this.fetchDestinations(() =>
      this.getPreviousDestinations(this.currentQueryLimit)
    );
  }

  getSearchResultsData(searchQuery: string, queryLimit = 5) {
    this.currentQueryLimit = queryLimit;
    const endTerm = searchQuery + '\uf8ff';
    this.currentQueryBuilder = () => [
      where('country', '>=', searchQuery),
      where('country', '<=', endTerm),
      orderBy('country')
    ];
    return this.fetchDestinations(() =>
      this.getSearchResults(searchQuery, queryLimit)
    );
  }

  private getAllDestinations() {
    return defer(() =>
      from(
        getDocs(
          query(collection(this.firestore, 'destinations'), orderBy('country'))
        )
      )
    );
  }

  private getFirstDestinations(queryLimit = 5) {
    return defer(() =>
      from(getDocs(this.buildCurrentQuery(limit(queryLimit)))).pipe(
        tap((documentSnapshots) => {
          const firstVisible = documentSnapshots.docs[0] ?? null;
          const lastVisible =
            documentSnapshots.docs[documentSnapshots.docs.length - 1] ?? null;
          this.previousDocsStack = firstVisible ? [firstVisible] : [];
          this.firstVisibleDocs.set(firstVisible);
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
          this.buildCurrentQuery(startAfter(lastVisible), limit(queryLimit))
        )
      ).pipe(
        tap((documentSnapshots) => {
          const firstVisible = documentSnapshots.docs[0] ?? null;
          const lastVisible =
            documentSnapshots.docs[documentSnapshots.docs.length - 1] ?? null;
          if (firstVisible) {
            this.previousDocsStack.push(firstVisible);
            this.firstVisibleDocs.set(firstVisible);
          }
          if (lastVisible) {
            this.lastVisibleDocs.set(lastVisible);
          }
        })
      );
    });
  }

  private getPreviousDestinations(queryLimit = 5) {
    return defer(() => {
      if (this.previousDocsStack.length < 2) {
        return of({} as QuerySnapshot<DocumentData, DocumentData>);
      }
      const currentFirstVisible = this.previousDocsStack.pop();
      if (!currentFirstVisible) {
        return of({} as QuerySnapshot<DocumentData, DocumentData>);
      }

      return from(
        getDocs(
          this.buildCurrentQuery(
            endBefore(currentFirstVisible),
            limitToLast(queryLimit)
          )
        )
      ).pipe(
        tap((documentSnapshots) => {
          const firstVisible = documentSnapshots.docs[0] ?? null;
          const lastVisible =
            documentSnapshots.docs[documentSnapshots.docs.length - 1] ?? null;
          this.firstVisibleDocs.set(firstVisible);
          this.lastVisibleDocs.set(lastVisible);
          if (firstVisible && this.previousDocsStack.length > 0) {
            this.previousDocsStack[this.previousDocsStack.length - 1] =
              firstVisible;
          }
        })
      );
    });
  }

  private getSearchResults(searchQuery: string, queryLimit = 5) {
    return this.getFirstDestinations(queryLimit);
  }

  private fetchDestinations(
    fetchMethod: () => Observable<QuerySnapshot<DocumentData, DocumentData>>
  ): Observable<Destination[]> {
    return fetchMethod().pipe(
      switchMap((documents) => {
        const docs = documents.docs ?? [];
        if (docs.length === 0) {
          return of([]);
        }

        const data = docs.map((doc) => {
          return { ...doc.data(), id: doc.id };
        }) as Destination[];
        const destinationObservables = data.map((document) => {
          return forkJoin({
            image1: this.firebaseStorageService.getImage(document['image1']),
            image2: this.firebaseStorageService.getImage(document['image2']),
            image3: this.firebaseStorageService.getImage(document['image3']),
            imageBig: this.firebaseStorageService.getImage(document['imageBig'])
          }).pipe(
            map((images) => ({
              ...document,
              ...images
            }))
          );
        });
        return forkJoin(destinationObservables);
      })
    );
  }

  private buildCurrentQuery(...constraints: QueryConstraint[]) {
    return query(
      collection(this.firestore, 'destinations'),
      ...this.currentQueryBuilder(),
      ...constraints
    );
  }

  getPreviousDocsStackLength() {
    return this.previousDocsStack.length;
  }

  getPreviousDocsStack() {
    return this.previousDocsStack;
  }
}
