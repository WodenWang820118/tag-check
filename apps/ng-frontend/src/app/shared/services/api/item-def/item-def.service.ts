import { computed, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, throwError } from 'rxjs';
import { ItemDef } from '@utils';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ItemDefService {
  tempItemDefContent = signal<ItemDef | null>(null);
  tempItemDefContent$ = computed(() => this.tempItemDefContent());
  itemDefContent = signal<ItemDef | null>(null);
  itemDefContent$ = computed(() => this.itemDefContent());
  isLoading = signal(false);
  isLoading$ = computed(() => this.isLoading());

  constructor(private readonly http: HttpClient) {}

  setTempItemDef(itemDef: ItemDef | null) {
    this.tempItemDefContent.set(itemDef);
  }

  setItemDef(itemDef: ItemDef | null) {
    this.itemDefContent.set(itemDef);
  }

  setLoading(isLoading: boolean) {
    this.isLoading.set(isLoading);
  }

  readItemDefJsonFileContent(file: File): void {
    const reader = new FileReader();

    reader.onload = (e: any) => {
      const fileContentString = e.target.result;

      try {
        const parsed = JSON.parse(fileContentString);
        // Accept either full DTO shape or just the fullItemDef object
        const value: ItemDef = parsed?.fullItemDef
          ? (parsed as ItemDef)
          : ({
              templateName: '',
              itemId: '',
              fullItemDef: parsed
            } as ItemDef);
        this.tempItemDefContent.set(value);
        setTimeout(() => {
          this.setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error parsing file content', error);
      }
    };

    reader.onerror = () => {
      console.error('Error reading file content');
    };

    reader.readAsText(file);
  }

  getItemDefById(itemId: string) {
    if (!itemId) return of(null);
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

  getItemDefByTemplateName(templateName: string) {
    if (!templateName) return of(null);
    return this.http
      .get<ItemDef>(
        `${environment.specApiUrl}/${encodeURIComponent(templateName)}/item-def`
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
