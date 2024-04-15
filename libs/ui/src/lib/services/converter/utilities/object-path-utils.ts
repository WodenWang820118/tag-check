import { NestedObject } from '../../../interfaces/gtm-config-generator';

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
export function getAllObjectPaths(obj: NestedObject, prefix = ''): string[] {
  let paths: string[] = [];

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const path = prefix ? `${prefix}.${key}` : key;
      paths.push(path);

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        const nestedPaths = getAllObjectPaths(obj[key], path);
        paths = paths.concat(nestedPaths);
      }
    }
  }
  return paths;
}
