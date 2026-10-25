import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ItemDef } from '@utils';
import { environment } from '../../../../../environments/environment';

/**
 * Reads and saves the optional item definition (ItemDef) of one test, at
 * `/specs/:projectSlug/:eventId/item-def`. Each test has its own; tests of
 * the same event in other projects are not touched.
 */
@Injectable({
  providedIn: 'root'
})
export class ItemDefService {
  constructor(private readonly http: HttpClient) {}

  /** The test's item definition, or null when it has none. */
  getItemDef(projectSlug: string, eventId: string) {
    if (!projectSlug || !eventId) {
      return throwError(
        () => new Error('projectSlug and eventId are required')
      );
    }
    return this.http.get<ItemDef | null>(this.url(projectSlug, eventId)).pipe(
      catchError((error) => {
        console.error(error);
        return throwError(() => new Error('Failed to get item definition'));
      })
    );
  }

  /** Updates the test's item definition, or creates it if it has none. */
  updateItemDef(
    projectSlug: string,
    eventId: string,
    itemDef: Partial<ItemDef>
  ) {
    if (!projectSlug || !eventId) {
      return throwError(
        () =>
          new Error(
            'projectSlug and eventId are required to update item definition'
          )
      );
    }
    return this.http.put<ItemDef>(this.url(projectSlug, eventId), itemDef).pipe(
      catchError((error) => {
        console.error(error);
        return throwError(() => new Error('Failed to update item definition'));
      })
    );
  }

  private url(projectSlug: string, eventId: string) {
    return `${environment.specApiUrl}/${encodeURIComponent(projectSlug)}/${encodeURIComponent(eventId)}/item-def`;
  }
}
