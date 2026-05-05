import { Injectable } from '@angular/core';
import { NestedObject } from '@utils';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  extractAccountAndContainerId(url: string) {
    const regex = /accounts\/(\d+)\/containers\/(\d+)/;
    const result = regex.exec(url);
    if (result) {
      return {
        accountId: result[1],
        containerId: result[2]
      };
    }
    return {
      accountId: '',
      containerId: ''
    };
  }

  outputTime() {
    // output the time in GTM export format: 2023-08-03 02:16:33
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
      ` ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    );
  }

  /**
   * A function to get all paths from the root to each leaf node in a nested object.
   *
   * @param obj - The nested object to get the paths from.
   * @param prefix - The current path prefix, used during recursion.
   * @returns An array of paths. Each path is a string with properties separated by dots.
   *
   * @example
   * // returns ['a', 'b', 'b.c', 'b.d', 'b.d.e']
   * getAllObjectPaths({ a: 1, b: { c: 2, d: { e: 3 } } })
   */
  getAllObjectPaths(obj: NestedObject, prefix = ''): string[] {
    let paths: string[] = [];

    for (const key in obj) {
      if (Object.hasOwn(obj, key)) {
        const path = prefix ? `${prefix}.${key}` : key;
        paths.push(path);

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          const nestedPaths = this.getAllObjectPaths(obj[key], path);
          paths = paths.concat(nestedPaths);
        }
      }
    }
    return paths;
  }
}
