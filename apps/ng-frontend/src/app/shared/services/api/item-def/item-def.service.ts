import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { ItemDef } from '@utils';
import { environment } from '../../../../../environments/environment';

/** Reads and saves the optional item definition (ItemDef) of a test. */
@Injectable({
  providedIn: 'root'
})
export class ItemDefService {
  constructor(private readonly http: HttpClient) {}

  getItemDefById(itemId: string) {
    if (!itemId) return throwError(() => new Error('itemId is required'));
    return this.http
      .get<ItemDef>(
        `${environment.specApiUrl}/${encodeURIComponent(itemId)}/item-def`
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(() => new Error('Failed to get item definition'));
        })
      );
  }

  updateItemDef(itemId: string, itemDef: Partial<ItemDef>) {
    if (!itemId) {
      return throwError(
        () => new Error('itemId is required to update item definition')
      );
    }
    return this.http
      .put<ItemDef>(
        `${environment.specApiUrl}/${encodeURIComponent(itemId)}/item-def`,
        itemDef
      )
      .pipe(
        catchError((error) => {
          console.error(error);
          return throwError(
            () => new Error('Failed to update item definition')
          );
        })
      );
  }
}
