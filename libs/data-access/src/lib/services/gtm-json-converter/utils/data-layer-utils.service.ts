import { Injectable } from '@angular/core';
import { DataLayer, StrictDataLayerEvent } from '@utils';
import { UtilsService } from './utils.service';

/** A path segment that indexes an array, such as the `0` in `items.0.price`. */
const ARRAY_INDEX_SEGMENT = /(?:^|\.)\d+(?:\.|$)/;

/**
 * Turns data layer specs into the events and key paths tag-build creates
 * variables, triggers and tags for.
 */
@Injectable({
  providedIn: 'root'
})
export class DataLayerUtils {
  constructor(private readonly utilsService: UtilsService) {}

  /**
   * Returns one entry per event name, in first-seen order, with the dot paths
   * of every key its specs push. Specs that repeat an event are merged, so
   * the container gets one trigger and one tag per event rather than
   * duplicates that would send the event twice.
   *
   * The `ecommerce` object itself and paths inside arrays are left out: a
   * GA4 event tag sends `items` as one array parameter, never item by item.
   */
  getDataLayers(specs: StrictDataLayerEvent[]): DataLayer[] {
    const pathsByEvent = new Map<string, Set<string>>();
    for (const { event, ...rest } of specs) {
      const paths = pathsByEvent.get(event) ?? new Set<string>();
      for (const path of this.utilsService.getAllObjectPaths(rest)) {
        if (path !== 'ecommerce' && !ARRAY_INDEX_SEGMENT.test(path)) {
          paths.add(path);
        }
      }
      pathsByEvent.set(event, paths);
    }
    return Array.from(pathsByEvent, ([event, paths]) => ({
      event,
      paths: [...paths]
    }));
  }
}
