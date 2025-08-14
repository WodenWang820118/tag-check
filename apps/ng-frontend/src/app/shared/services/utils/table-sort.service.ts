import { Injectable } from '@angular/core';
import { Sort } from '@angular/material/sort';

export interface SortableColumn {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  accessor?: (item: any) => any;
}

@Injectable({
  providedIn: 'root'
})
export class TableSortService {
  /**
   * Sorts data based on the provided sort configuration and column definitions
   */
  sortData<T>(sort: Sort, data: T[], columns: SortableColumn[]): T[] {
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

  private getValueForComparison(item: any, column: SortableColumn): any {
    if (column.accessor) {
      return column.accessor(item);
    }
    return item[column.name];
  }

  private compare(
    a: any,
    b: any,
    isAsc: boolean,
    type: SortableColumn['type']
  ): number {
    // extract sort order instead of repeating nested ternaries
    const sortOrder = isAsc ? 1 : -1;

    switch (type) {
      case 'date': {
        // ...existing date parsing code...
        const dateA = a instanceof Date ? a : new Date(a);
        const dateB = b instanceof Date ? b : new Date(b);
        return (dateA.getTime() - dateB.getTime()) * sortOrder;
      }
      case 'number':
        // number comparison
        return (Number(a) - Number(b)) * sortOrder;
      case 'boolean': {
        if (a === b) {
          return 0;
        }
        return (a ? -1 : 1) * sortOrder;
      }
      default: {
        // string
        if (a < b) {
          return -1 * sortOrder;
        }
        return 1 * sortOrder;
      }
    }
  }
}
