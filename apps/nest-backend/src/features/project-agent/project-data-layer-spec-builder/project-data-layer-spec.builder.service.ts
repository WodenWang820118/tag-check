import { Injectable, Logger } from '@nestjs/common';
import { isDeepStrictEqual } from 'node:util';
import {
  Spec,
  StrictDataLayerEvent,
  VariableConfig,
  getDataLayerVariablePath,
  getGa4EventParameterRows,
  getParameterListItems,
  getParameterMapValue,
  getParameterValue
} from '@utils';

type SpecNode = Record<string, unknown>;

/**
 * Builds the expected `dataLayer` push of a GA4 event tag, resolving the
 * tag's variables to the data layer keys they read.
 */
@Injectable()
export class ProjectDataLayerSpecBuilderService {
  private readonly logger = new Logger(ProjectDataLayerSpecBuilderService.name);

  /**
   * Builds the data layer push a GA4 event tag depends on. Each event
   * parameter read from a Data Layer Variable becomes a required key at that
   * variable's data layer path, e.g. `{{DLV - ecommerce.value}}` reading
   * `ecommerce.value` requires `ecommerce.value`. Parameters set from other
   * variables or literal values do not come from the data layer and are left
   * out.
   */
  buildDataLayerSpec(
    spec: Spec,
    variables: readonly VariableConfig[] = []
  ): StrictDataLayerEvent {
    const result: StrictDataLayerEvent = { event: this.getEventName(spec) };
    for (const { value } of getGa4EventParameterRows(spec.tag, variables)) {
      const path = getDataLayerVariablePath(value, variables);
      if (path) {
        requireAtPath(result as unknown as SpecNode, toObjectPath(path), value);
      }
    }
    return result;
  }

  /**
   * The spec this service produced before it resolved variables: every event
   * parameter under `ecommerce`, verbatim. Kept only to recognise stored specs
   * that were generated that way and never edited.
   */
  buildLegacyDataLayerSpec(spec: Spec): StrictDataLayerEvent {
    const result: StrictDataLayerEvent = { event: this.getEventName(spec) };
    const eventSettings = spec.tag.parameter.find(
      (p) => p.key === 'eventSettingsTable' && p.type === 'LIST'
    );
    const ecommerce: SpecNode = {};
    for (const entry of getParameterListItems(eventSettings)) {
      const paramName = getParameterMapValue(entry, 'parameter');
      const paramValue = getParameterMapValue(entry, 'parameterValue');
      if (paramName && paramValue) {
        ecommerce[paramName] = paramValue;
      }
    }
    if (Object.keys(ecommerce).length > 0) {
      result.ecommerce = ecommerce as StrictDataLayerEvent['ecommerce'];
    }
    return result;
  }

  /**
   * Returns the current build for a stored spec that is still exactly the
   * legacy build of its tag, or null when the spec was edited, is already
   * current, or the container's variables are unknown.
   */
  upgradeLegacyDataLayerSpec(
    stored: StrictDataLayerEvent | undefined,
    rawGtmTag: Spec | undefined,
    variables: readonly VariableConfig[]
  ): StrictDataLayerEvent | null {
    if (!stored || !rawGtmTag?.tag || variables.length === 0) {
      return null;
    }
    try {
      const legacy = this.buildLegacyDataLayerSpec(rawGtmTag);
      const current = this.buildDataLayerSpec(rawGtmTag, variables);
      return isDeepStrictEqual(stored, legacy) &&
        !isDeepStrictEqual(stored, current)
        ? current
        : null;
    } catch (error) {
      this.logger.warn(`Cannot rebuild stored spec: ${error}`);
      return null;
    }
  }

  /** True when `stored` is what this service generates, or used to generate, for the tag. */
  isGeneratedDataLayerSpec(
    stored: StrictDataLayerEvent | undefined,
    rawGtmTag: Spec | undefined,
    variables: readonly VariableConfig[]
  ): boolean {
    if (!stored || !rawGtmTag?.tag) {
      return false;
    }
    try {
      return (
        isDeepStrictEqual(stored, this.buildLegacyDataLayerSpec(rawGtmTag)) ||
        isDeepStrictEqual(stored, this.buildDataLayerSpec(rawGtmTag, variables))
      );
    } catch {
      return false;
    }
  }

  private getEventName(spec: Spec): string {
    const eventName = getParameterValue(spec.tag.parameter, 'eventName');
    if (!eventName) {
      this.logger.warn(`No eventName found for spec=${JSON.stringify(spec)}`);
      throw new Error('eventName is required in spec');
    }
    return eventName;
  }
}

/**
 * Marks `path` as required. A Data Layer Variable for a whole object (such as
 * `ecommerce`) never replaces requirements already recorded inside it.
 */
function requireAtPath(target: SpecNode, path: string[], value: string): void {
  const [key, ...rest] = path;
  if (rest.length === 0) {
    if (!isNode(target[key])) {
      target[key] = value;
    }
    return;
  }
  if (!isNode(target[key])) {
    target[key] = {};
  }
  requireAtPath(target[key] as SpecNode, rest, value);
}

/**
 * Stops at the first array index (`ecommerce.items.0.item_id` requires
 * `ecommerce.items`): specs describe arrays by their entries, not by position.
 */
function toObjectPath(path: string[]): string[] {
  const index = path.findIndex((segment) => /^\d+$/.test(segment));
  return index > 0 ? path.slice(0, index) : path;
}

function isNode(value: unknown): value is SpecNode {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
