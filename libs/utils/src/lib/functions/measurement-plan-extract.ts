/**
 * Reads a GA4 measurement plan back out of a Tag Manager container: the
 * published GA4 event tags are the site's de facto plan. The rows use the
 * same shape as an uploaded plan, so the result can be downloaded, edited and
 * uploaded to Tag Build again.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 * @see https://developers.google.com/tag-platform/tag-manager/api/reference/rest/v2/Condition
 */

import { TagTypeEnum, TriggerTypeEnum } from '../enums/tag-build';
import type {
  GTMConfiguration,
  TagConfig,
  TriggerConfig,
  VariableConfig
} from '../types/tag-build';
import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  getGa4EventNameIssues
} from './ga4-reference';
import {
  getGa4EventParameterTable,
  resolveVariableReference
} from './gtm-container-export';
import type { MeasurementPlanRow } from './measurement-plan';
import { getParameterValue } from './tag-build-contract';

/** A plan row with what the reader should check before relying on it. */
export type ExtractedMeasurementPlanRow = MeasurementPlanRow & {
  notes: string[];
};

export type MeasurementPlanExtraction = {
  rows: ExtractedMeasurementPlanRow[];
  /** GA4 event tags that produced no row, each with the reason. */
  skipped: string[];
  /** The container's GA4 event tags, paused ones included. */
  ga4EventTagCount: number;
};

/**
 * Item parameters the container cannot tell: a tag sends the `items` array
 * as one value. Google requires one of `item_id` and `item_name` on every
 * item, so the row starts with those two.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */
const MINIMUM_ITEM_PARAMETERS: readonly string[] = ['item_id', 'item_name'];

/** The built-in Event variable; triggers test the same value as `{{_event}}`. */
const EVENT_VARIABLE = '{{Event}}';
const EVENT_FILTER_ARGUMENT = '{{_event}}';
/** A regex that only lists names, such as `^(view_item|add_to_cart)$`. */
const NAME_ALTERNATION =
  /^\^(?:\(([\p{L}\p{N}_]+(?:\|[\p{L}\p{N}_]+)*)\)|([\p{L}\p{N}_]+))\$$/u;

/**
 * Lists one plan row per event name the container's GA4 event tags send.
 * Paused tags and tags whose event name is only known at run time are
 * skipped with the reason. Tags sending the same event name are merged.
 */
export function extractMeasurementPlan(
  container: GTMConfiguration
): MeasurementPlanExtraction {
  const {
    tag: tags,
    trigger: triggers,
    variable: variables
  } = container.containerVersion;
  const eventTags = tags.filter((tag) => tag.type === TagTypeEnum.GAAWE);
  const rows = new Map<
    string,
    ExtractedMeasurementPlanRow & { tagNames: string[] }
  >();
  const skipped: string[] = [];

  for (const tag of eventTags) {
    if (tag.paused) {
      skipped.push(`Tag "${tag.name}": paused.`);
      continue;
    }
    const { names, problems } = getEventNames(tag, triggers, variables);
    skipped.push(...problems.map((problem) => `Tag "${tag.name}": ${problem}`));
    const sent = getSentParameters(tag, variables);

    for (const eventName of names) {
      const row = withEcommerceParameters(eventName, tag, sent);
      const existing = rows.get(eventName);
      if (existing) {
        mergeInto(existing, row);
        existing.tagNames.push(tag.name);
      } else {
        rows.set(eventName, { ...row, tagNames: [tag.name] });
      }
    }
  }

  return {
    rows: [...rows.values()].map(({ tagNames, ...row }) =>
      tagNames.length > 1
        ? {
            ...row,
            notes: [
              ...row.notes,
              `Merged from tags: ${tagNames.map((name) => `"${name}"`).join(', ')}.`
            ]
          }
        : row
    ),
    skipped,
    ga4EventTagCount: eventTags.length
  };
}

function getEventNames(
  tag: TagConfig,
  triggers: readonly TriggerConfig[],
  variables: readonly VariableConfig[]
): { names: string[]; problems: string[] } {
  const raw = getParameterValue(tag.parameter, 'eventName')?.trim();
  if (!raw) {
    return { names: [], problems: ['it has no event name.'] };
  }
  if (raw === EVENT_VARIABLE) {
    return getTriggerEventNames(tag, triggers);
  }
  if (!raw.includes('{{')) {
    return validNames([raw]);
  }
  const resolved = resolveVariableReference(raw, variables);
  if (resolved?.kind === 'constant') {
    return validNames([resolved.value]);
  }
  return {
    names: [],
    problems: [
      `the event name ${raw} is only known at run time; add its events by hand.`
    ]
  };
}

/**
 * The event names `{{Event}}` takes: the custom event names of the tag's
 * firing triggers, from an `equals` condition or a regex that only lists
 * names.
 */
function getTriggerEventNames(
  tag: TagConfig,
  triggers: readonly TriggerConfig[]
): { names: string[]; problems: string[] } {
  const names: string[] = [];
  const problems: string[] = [];
  if (!tag.firingTriggerId?.length) {
    return {
      names,
      problems: [
        'the event name is {{Event}} and it has no firing triggers; add its events by hand.'
      ]
    };
  }
  for (const triggerId of tag.firingTriggerId) {
    const trigger = triggers.find(
      (candidate) => candidate.triggerId === triggerId
    );
    const fromTrigger =
      trigger?.type === TriggerTypeEnum.CUSTOM_EVENT
        ? getCustomEventNames(trigger)
        : [];
    if (fromTrigger.length === 0) {
      problems.push(
        `the event name is {{Event}} and trigger "${trigger?.name ?? triggerId}" does not name its custom events; add them by hand.`
      );
    }
    names.push(...fromTrigger);
  }
  const valid = validNames(names);
  return { names: valid.names, problems: [...problems, ...valid.problems] };
}

function getCustomEventNames(trigger: TriggerConfig): string[] {
  let names: string[] | undefined;
  for (const condition of trigger.customEventFilter ?? []) {
    const argument = getParameterValue(condition.parameter, 'arg0');
    if (argument !== EVENT_FILTER_ARGUMENT) {
      continue;
    }
    const value = getParameterValue(condition.parameter, 'arg1')?.trim();
    if (
      !value ||
      getParameterValue(condition.parameter, 'negate') === 'true' ||
      getParameterValue(condition.parameter, 'ignore_case') === 'true'
    ) {
      return [];
    }
    let conditionNames: string[];
    if (condition.type === 'EQUALS') {
      conditionNames = [value];
    } else if (condition.type === 'MATCH_REGEX') {
      const match = NAME_ALTERNATION.exec(value);
      conditionNames = (match?.[1] ?? match?.[2])?.split('|') ?? [];
    } else {
      return [];
    }
    if (conditionNames.length === 0) {
      return [];
    }
    names = names
      ? names.filter((name) => conditionNames.includes(name))
      : conditionNames;
  }
  return names ?? [];
}

function validNames(names: string[]): { names: string[]; problems: string[] } {
  const valid: string[] = [];
  const problems: string[] = [];
  for (const name of new Set(names)) {
    const issues = getGa4EventNameIssues(name);
    if (issues.length === 0) {
      valid.push(name);
    } else {
      problems.push(
        `"${name}" is not a valid GA4 event name: it ${issues.join(' and ')}.`
      );
    }
  }
  return { names: valid, problems };
}

type SentParameters = {
  names: string[];
  notFromDataLayer: string[];
  notes: string[];
};

/** The tag's parameter names, and those whose value is not a data layer key. */
function getSentParameters(
  tag: TagConfig,
  variables: readonly VariableConfig[]
): SentParameters {
  const names: string[] = [];
  const notFromDataLayer: string[] = [];
  const { rows, notes } = getGa4EventParameterTable(tag, variables);
  for (const { parameter, value } of rows) {
    if (names.includes(parameter)) {
      continue;
    }
    names.push(parameter);
    const resolved = resolveVariableReference(value, variables);
    if (resolved?.kind === 'dataLayer') {
      continue;
    }
    if (resolved?.kind === 'constant' || !value.includes('{{')) {
      notFromDataLayer.push(
        `${parameter} = "${resolved?.kind === 'constant' ? resolved.value : value}"`
      );
    } else {
      notFromDataLayer.push(`${parameter} from ${value}`);
    }
  }
  return { names, notFromDataLayer, notes };
}

function withEcommerceParameters(
  eventName: string,
  tag: TagConfig,
  sent: SentParameters
): ExtractedMeasurementPlanRow {
  const eventParameters = [...sent.names];
  const notes = [...sent.notes];
  if (sent.notFromDataLayer.length > 0) {
    notes.push(
      `Not read directly from the data layer: ${sent.notFromDataLayer.join('; ')}.`
    );
  }

  if (getParameterValue(tag.parameter, 'sendEcommerceData') === 'true') {
    const recommended = Object.hasOwn(GA4_ECOMMERCE_EVENT_PARAMETERS, eventName)
      ? GA4_ECOMMERCE_EVENT_PARAMETERS[eventName]
      : undefined;
    if (recommended) {
      eventParameters.push(
        ...recommended.filter((name) => !eventParameters.includes(name))
      );
      notes.push(
        "The tag sends the data layer's ecommerce object; its parameters are Google's recommended ones for this event."
      );
    } else {
      notes.push(
        "The tag sends the data layer's ecommerce object; list the parameters it holds."
      );
    }
  }

  let itemParameters: string[] = [];
  if (eventParameters.includes('items')) {
    itemParameters = [...MINIMUM_ITEM_PARAMETERS];
    notes.push(
      'Item parameters are not in the container: item_id and item_name are a start (GA4 requires one of them); add the others the site sends.'
    );
  }

  return {
    eventName,
    eventParameters: eventParameters.filter((name) => name !== 'items'),
    itemParameters,
    notes
  };
}

function mergeInto(
  target: ExtractedMeasurementPlanRow,
  source: ExtractedMeasurementPlanRow
): void {
  for (const key of ['eventParameters', 'itemParameters'] as const) {
    target[key].push(
      ...source[key].filter((name) => !target[key].includes(name))
    );
  }
  target.notes.push(
    ...source.notes.filter((note) => !target.notes.includes(note))
  );
}
