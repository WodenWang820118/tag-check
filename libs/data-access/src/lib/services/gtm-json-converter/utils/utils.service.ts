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
    //output the time like the format: 2023-08-03 02:16:33
    const date: Date = new Date();

    const year: number = date.getFullYear();

    let month: number | string = date.getMonth() + 1; // getMonth() is zero-indexed, so we need to add 1
    month = month < 10 ? '0' + month : month; // ensure month is 2-digits

    let day: number | string = date.getDate();
    day = day < 10 ? '0' + day : day; // ensure day is 2-digits

    let hours: number | string = date.getHours();
    hours = hours < 10 ? '0' + hours : hours; // ensure hours is 2-digits

    let minutes: number | string = date.getMinutes();
    minutes = minutes < 10 ? '0' + minutes : minutes; // ensure minutes is 2-digits

    let seconds: number | string = date.getSeconds();
    seconds = seconds < 10 ? '0' + seconds : seconds; // ensure seconds is 2-digits

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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
