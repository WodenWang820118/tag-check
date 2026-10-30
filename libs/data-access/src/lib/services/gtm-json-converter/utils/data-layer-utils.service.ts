import { Injectable } from '@angular/core';
import {
  DataLayer,
  ParameterRule,
  StrictDataLayerEvent,
  extractTagCheckRulesFromSpec,
  formatTagCheckNotes
} from '@utils';
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
   *
   * Any other object with keys of its own, such as `user` in
   * `{ user: { id, type } }`, is left out as well, so it gets neither an
   * event parameter nor a Data Layer Variable: its keys are sent as
   * `user_id` and `user_type`. GA4 has no object parameter value. The
   * BigQuery export stores an event parameter's value as a string, an
   * integer or a double, and the Measurement Protocol limits parameter
   * values to 100 characters (500 for GA4 360).
   * @see https://support.google.com/analytics/answer/7029846
   * @see https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference#payload_post_body
   */
  getDataLayers(specs: StrictDataLayerEvent[]): DataLayer[] {
    const pathsByEvent = new Map<string, Set<string>>();
    const eventRulesByEvent = new Map<string, ParameterRule[]>();
    const itemRulesByEvent = new Map<string, ParameterRule[]>();

    for (const spec of specs) {
      const { event, ...rest } = spec;
      const paths = pathsByEvent.get(event) ?? new Set<string>();
      for (const path of this.utilsService.getAllObjectPaths(rest)) {
        if (
          path !== 'ecommerce' &&
          !ARRAY_INDEX_SEGMENT.test(path) &&
          !isObjectWithKeys(valueAtPath(rest, path))
        ) {
          paths.add(path);
        }
      }
      pathsByEvent.set(event, paths);

      const { eventRules, itemRules } = extractTagCheckRulesFromSpec(spec);
      if (eventRules.length > 0) {
        const existing = eventRulesByEvent.get(event) ?? [];
        eventRulesByEvent.set(event, mergeRules(existing, eventRules));
      }
      if (itemRules.length > 0) {
        const existing = itemRulesByEvent.get(event) ?? [];
        itemRulesByEvent.set(event, mergeRules(existing, itemRules));
      }
    }

    return Array.from(pathsByEvent, ([event, paths]) => {
      const notes = formatTagCheckNotes(
        eventRulesByEvent.get(event) ?? [],
        itemRulesByEvent.get(event) ?? []
      );
      return {
        event,
        paths: [...paths],
        ...(notes ? { notes } : {})
      };
    });
  }
}

function mergeRules(
  existing: ParameterRule[],
  incoming: ParameterRule[]
): ParameterRule[] {
  const seen = new Set(existing.map((r) => r.name));
  const result = [...existing];
  for (const rule of incoming) {
    if (!seen.has(rule.name)) {
      seen.add(rule.name);
      result.push(rule);
    }
  }
  return result;
}

/** The value a dot path reads, as a version 2 Data Layer Variable reads it. */
function valueAtPath(spec: object, path: string): unknown {
  return path
    .split('.')
    .reduce<unknown>(
      (node, key) => (isRecord(node) ? node[key] : undefined),
      spec
    );
}

/** A non-array object with at least one key, whose keys get paths of their own. */
function isObjectWithKeys(value: unknown): boolean {
  return isRecord(value) && Object.keys(value).length > 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
