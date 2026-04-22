import { Injectable } from '@angular/core';
import { Sort } from '@angular/material/sort';

type SortableValue = string | number | boolean | Date | null | undefined;

export interface SortableColumn<T> {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  accessor?: (item: T) => SortableValue;
}

@Injectable({
  providedIn: 'root'
})
export class TableSortService {
  /**
   * Sorts data based on the provided sort configuration and column definitions
   */
  sortData<T>(sort: Sort, data: T[], columns: SortableColumn<T>[]): T[] {
    if (!sort.active || sort.direction === '') {
      return data;
    }

    const column = columns.find((col) => col.name === sort.active);
    if (!column) {
      return data;
    }

    return [...data].sort((a: T, b: T) => {
      const isAsc = sort.direction === 'asc';
      const valueA = this.getValueForComparison(a, column);
      const valueB = this.getValueForComparison(b, column);

      return this.compare(valueA, valueB, isAsc, column.type);
    });
  }

  private getValueForComparison<T>(
    item: T,
    column: SortableColumn<T>
  ): SortableValue {
    if (column.accessor) {
      return column.accessor(item);
    }

    const value = (item as Record<string, unknown>)[column.name];
    if (
      value == null ||
      value instanceof Date ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    return JSON.stringify(value);
  }

  private compare(
    a: SortableValue,
    b: SortableValue,
    isAsc: boolean,
    type: SortableColumn<unknown>['type']
  ): number {
    const sortOrder = isAsc ? 1 : -1;

    switch (type) {
      case 'date': {
        const dateA = a instanceof Date ? a : new Date(String(a ?? ''));
        const dateB = b instanceof Date ? b : new Date(String(b ?? ''));
        return (dateA.getTime() - dateB.getTime()) * sortOrder;
      }
      case 'number':
        return (Number(a ?? 0) - Number(b ?? 0)) * sortOrder;
      case 'boolean': {
        if (a === b) {
          return 0;
        }
        return (a ? -1 : 1) * sortOrder;
      }
      default: {
        return String(a ?? '').localeCompare(String(b ?? '')) * sortOrder;
      }
    }
  }
}
