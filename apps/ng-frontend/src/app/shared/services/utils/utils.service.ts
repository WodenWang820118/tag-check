import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  isEmptyObject(value: unknown): boolean {
    if (value === null || value === undefined || value === '') {
      return true;
    }
    if (value === null || value === undefined) {
      return true;
    }

    if (typeof value !== 'object') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    if (value instanceof Date) {
      return false;
    }

    if (value instanceof Set || value instanceof Map) {
      return value.size === 0;
    }

    return (
      Object.keys(value).length === 0 &&
      Object.getOwnPropertySymbols(value).length === 0
    );
  }

  extractEventNameFromId(eventId: string) {
    const eventName = eventId.replace(
      /_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      ''
    );
    return eventName;
  }
}
