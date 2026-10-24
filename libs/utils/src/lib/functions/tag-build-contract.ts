import { TagTypeEnum } from '../enums/tag-build';
import type {
  GTMConfiguration,
  Parameter,
  ParameterListItem,
  ParameterMap,
  ParameterWithKeyValue,
  TagConfig,
  Trigger,
  TriggerConfig,
  VariableConfig
} from '../types/tag-build';
import type { Spec, StrictDataLayerEvent } from '../types/tag-check';

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === 'string')
  );
}

/**
 * Whether a value is a GTM parameter: a `type`, with an optional string
 * `key` and `value` and an optional `list` of list items.
 */
export function isParameter(value: unknown): value is Parameter {
  if (!isRecord(value) || typeof value['type'] !== 'string') {
    return false;
  }

  if (
    'key' in value &&
    value['key'] !== undefined &&
    typeof value['key'] !== 'string'
  ) {
    return false;
  }

  if (
    'value' in value &&
    value['value'] !== undefined &&
    typeof value['value'] !== 'string'
  ) {
    return false;
  }

  if (
    'list' in value &&
    value['list'] !== undefined &&
    !Array.isArray(value['list'])
  ) {
    return false;
  }

  return (
    !Array.isArray(value['list']) || value['list'].every(isParameterListItem)
  );
}

/**
 * Whether a value is a `MAP` parameter, such as one row of an event
 * parameter table.
 */
export function isParameterMap(value: unknown): value is ParameterMap {
  return (
    isRecord(value) &&
    value['type'] === 'MAP' &&
    Array.isArray(value['map']) &&
    value['map'].every(isParameter)
  );
}

/**
 * Whether a value can be an entry of a `LIST` parameter: a map, or a typed
 * entry such as a trigger reference.
 */
export function isParameterListItem(
  value: unknown
): value is ParameterListItem {
  if (isParameterMap(value)) {
    return true;
  }

  if (!isRecord(value) || typeof value['type'] !== 'string') {
    return false;
  }

  if (
    'value' in value &&
    value['value'] !== undefined &&
    typeof value['value'] !== 'string'
  ) {
    return false;
  }

  if ('map' in value && value['map'] !== undefined) {
    return Array.isArray(value['map']) && value['map'].every(isParameter);
  }

  return true;
}

/**
 * Whether a parameter has both a string `key` and a string `value`.
 */
export function isParameterWithKeyValue(
  parameter: Parameter
): parameter is ParameterWithKeyValue {
  return (
    typeof parameter.key === 'string' && typeof parameter.value === 'string'
  );
}

/**
 * The entries of a `LIST` parameter, or an empty array when it has none.
 */
export function getParameterListItems(
  parameter: Parameter | null | undefined
): ParameterListItem[] {
  return Array.isArray(parameter?.list) ? parameter.list : [];
}

/**
 * The string value of the parameter with this key (and type, when given),
 * or undefined when there is none.
 */
export function getParameterValue(
  parameters: readonly Parameter[] | null | undefined,
  key: string,
  type?: string
): string | undefined {
  const parameter = parameters?.find(
    (entry) => entry.key === key && (type ? entry.type === type : true)
  );

  return typeof parameter?.value === 'string' ? parameter.value : undefined;
}

/**
 * The string value stored under `key` in a `MAP` list item, or undefined
 * when the item is not a map or has no such entry.
 */
export function getParameterMapValue(
  item: ParameterListItem | null | undefined,
  key: string
): string | undefined {
  if (!isParameterMap(item)) {
    return undefined;
  }

  return getParameterValue(item.map, key);
}

/**
 * Whether a value is a trigger name with its ID.
 */
export function isTrigger(value: unknown): value is Trigger {
  return (
    isRecord(value) &&
    typeof value['name'] === 'string' &&
    typeof value['triggerId'] === 'string'
  );
}

/**
 * Whether a value has the fields every exported trigger has: name, type,
 * account and container IDs, and well-formed optional IDs and parameters.
 */
export function isTriggerConfig(value: unknown): value is TriggerConfig {
  if (
    !isRecord(value) ||
    typeof value['name'] !== 'string' ||
    typeof value['type'] !== 'string' ||
    typeof value['accountId'] !== 'string' ||
    typeof value['containerId'] !== 'string'
  ) {
    return false;
  }

  if (
    'triggerId' in value &&
    value['triggerId'] !== undefined &&
    typeof value['triggerId'] !== 'string'
  ) {
    return false;
  }

  if (
    'firingTriggerId' in value &&
    value['firingTriggerId'] !== undefined &&
    !isStringArray(value['firingTriggerId'])
  ) {
    return false;
  }

  if (
    'parameter' in value &&
    value['parameter'] !== undefined &&
    (!Array.isArray(value['parameter']) ||
      !value['parameter'].every(isParameter))
  ) {
    return false;
  }

  return true;
}

/**
 * Whether a value has the fields every exported tag has: name, type,
 * account and container IDs and a parameter array.
 */
export function isTagConfig(value: unknown): value is TagConfig {
  if (
    !isRecord(value) ||
    typeof value['name'] !== 'string' ||
    typeof value['type'] !== 'string' ||
    typeof value['accountId'] !== 'string' ||
    typeof value['containerId'] !== 'string' ||
    !Array.isArray(value['parameter']) ||
    !value['parameter'].every(isParameter)
  ) {
    return false;
  }

  if (
    'firingTriggerId' in value &&
    value['firingTriggerId'] !== undefined &&
    !isStringArray(value['firingTriggerId'])
  ) {
    return false;
  }

  if (
    'tagFiringOption' in value &&
    value['tagFiringOption'] !== undefined &&
    typeof value['tagFiringOption'] !== 'string'
  ) {
    return false;
  }

  return true;
}

/**
 * Whether a value has the fields every exported variable has.
 */
export function isVariableConfig(value: unknown): value is VariableConfig {
  if (
    !isRecord(value) ||
    typeof value['name'] !== 'string' ||
    typeof value['type'] !== 'string' ||
    typeof value['accountId'] !== 'string' ||
    typeof value['containerId'] !== 'string'
  ) {
    return false;
  }

  if (
    'parameter' in value &&
    value['parameter'] !== undefined &&
    (!Array.isArray(value['parameter']) ||
      !value['parameter'].every(isParameter))
  ) {
    return false;
  }

  return true;
}

/**
 * Whether a value is a tag with the triggers that fire it.
 */
export function isSpec(value: unknown): value is Spec {
  return (
    isRecord(value) &&
    isTagConfig(value['tag']) &&
    Array.isArray(value['trigger']) &&
    value['trigger'].every(isTriggerConfig)
  );
}

/**
 * Whether a value is an array of {@link isSpec} values.
 */
export function isSpecArray(value: unknown): value is Spec[] {
  return Array.isArray(value) && value.every(isSpec);
}

/**
 * Whether a value is an object with a string `event`: the minimum a
 * dataLayer spec needs.
 */
export function isStrictDataLayerEvent(
  value: unknown
): value is StrictDataLayerEvent {
  return isRecord(value) && typeof value['event'] === 'string';
}

/**
 * Whether every entry of an array is a dataLayer spec.
 */
export function isStrictDataLayerEventArray(
  value: unknown
): value is StrictDataLayerEvent[] {
  return Array.isArray(value) && value.every(isStrictDataLayerEvent);
}

function isGTMContainerVersion(
  value: unknown
): value is GTMConfiguration['containerVersion'] {
  return (
    isRecord(value) &&
    Array.isArray(value['variable']) &&
    value['variable'].every(isVariableConfig) &&
    Array.isArray(value['builtInVariable']) &&
    value['builtInVariable'].every(isVariableConfig) &&
    Array.isArray(value['trigger']) &&
    value['trigger'].every(isTriggerConfig) &&
    Array.isArray(value['tag']) &&
    value['tag'].every(isTagConfig)
  );
}

/**
 * Whether a value has the shape of a Tag Manager container export, with
 * all four lists (tag, trigger, variable, builtInVariable) present.
 */
export function isGTMConfiguration(value: unknown): value is GTMConfiguration {
  return (
    isRecord(value) &&
    typeof value['exportFormatVersion'] === 'number' &&
    typeof value['exportTime'] === 'string' &&
    isGTMContainerVersion(value['containerVersion'])
  );
}

/**
 * Whether Tag Manager can import a container: `issues` block the import,
 * `warnings` do not.
 */
export interface GTMImportReadiness {
  canImport: boolean;
  issues: string[];
  warnings: string[];
}

/**
 * Checks a generated container before the user imports it into Tag Manager:
 * export format 2, the version and container metadata, consistent paths, a
 * `GTM-` public ID and the same account and container IDs on every item.
 */
export function validateGTMImportReadiness(value: unknown): GTMImportReadiness {
  const issues: string[] = [];
  const warnings: string[] = [];

  if (!isGTMConfiguration(value)) {
    return {
      canImport: false,
      issues: ['Output is not a GTM container export JSON structure.'],
      warnings
    };
  }

  if (value.exportFormatVersion !== 2) {
    issues.push('exportFormatVersion must be 2 for GTM import.');
  }

  if (value.exportTime.trim().length === 0) {
    issues.push('exportTime must be present.');
  }

  const version = value.containerVersion;
  const requiredVersionFields = [
    'path',
    'accountId',
    'containerId',
    'containerVersionId',
    'fingerprint',
    'tagManagerUrl'
  ] as const;

  for (const field of requiredVersionFields) {
    if (!isNonEmptyString(version[field])) {
      issues.push(`containerVersion.${field} must be present.`);
    }
  }

  if (isRecord(version.container)) {
    validateContainerMetadata(version, issues, warnings);
  } else {
    issues.push('containerVersion.container must be present.');
  }

  validateContainerPath(version, issues);
  validateVersionItems('tag', version.tag, version, issues);
  validateVersionItems('trigger', version.trigger, version, issues);
  validateVersionItems('variable', version.variable, version, issues);
  validateVersionItems(
    'builtInVariable',
    version.builtInVariable,
    version,
    issues
  );

  if (version.tag.length === 0) {
    warnings.push('The export has no tags.');
  }

  if (version.trigger.length === 0) {
    warnings.push('The export has no triggers.');
  }

  return {
    canImport: issues.length === 0,
    issues,
    warnings
  };
}

function validateContainerMetadata(
  version: GTMConfiguration['containerVersion'],
  issues: string[],
  warnings: string[]
): void {
  const container = version.container as unknown as JsonRecord;
  const requiredContainerFields = [
    'path',
    'accountId',
    'containerId',
    'name',
    'publicId',
    'fingerprint',
    'tagManagerUrl'
  ] as const;

  for (const field of requiredContainerFields) {
    if (!isNonEmptyString(container[field])) {
      issues.push(`containerVersion.container.${field} must be present.`);
    }
  }

  if (container['accountId'] !== version.accountId) {
    issues.push('container accountId must match containerVersion accountId.');
  }

  if (container['containerId'] !== version.containerId) {
    issues.push(
      'container containerId must match containerVersion containerId.'
    );
  }

  if (
    typeof container['publicId'] !== 'string' ||
    !/^GTM-[A-Z0-9]+$/.test(container['publicId'])
  ) {
    issues.push('container publicId must look like a GTM container ID.');
  }

  if (
    !Array.isArray(container['usageContext']) ||
    !container['usageContext'].includes('WEB')
  ) {
    issues.push('container usageContext must include WEB.');
  }

  if (!Array.isArray(container['tagIds']) || container['tagIds'].length === 0) {
    warnings.push('The export has no container tag IDs.');
  }
}

function validateContainerPath(
  version: GTMConfiguration['containerVersion'],
  issues: string[]
): void {
  const containerPath = `accounts/${version.accountId}/containers/${version.containerId}`;
  const versionPath = `${containerPath}/versions/${version.containerVersionId}`;

  if (
    isRecord(version.container) &&
    typeof version.container['path'] === 'string' &&
    version.container['path'] !== containerPath
  ) {
    issues.push('container path must match accountId and containerId.');
  }

  if (version.path !== versionPath) {
    issues.push(
      'containerVersion path must match accountId, containerId, and version ID.'
    );
  }
}

function validateVersionItems(
  label: 'tag' | 'trigger' | 'variable' | 'builtInVariable',
  items: Array<TagConfig | TriggerConfig | VariableConfig>,
  version: GTMConfiguration['containerVersion'],
  issues: string[]
): void {
  items.forEach((item, index) => {
    if (item.accountId !== version.accountId) {
      issues.push(`${label}[${index}].accountId must match the container.`);
    }

    if (item.containerId !== version.containerId) {
      issues.push(`${label}[${index}].containerId must match the container.`);
    }
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * A tag with only a name, for specs that have no tag yet. It defaults to a
 * GA4 event tag with empty IDs and no parameters.
 */
export function createPlaceholderTagConfig(input: {
  name: string;
  type?: TagConfig['type'];
  accountId?: string;
  containerId?: string;
  parameter?: Parameter[];
}): TagConfig {
  return {
    name: input.name,
    type: input.type ?? TagTypeEnum.GAAWE,
    accountId: input.accountId ?? '',
    containerId: input.containerId ?? '',
    parameter: input.parameter ?? []
  };
}

/**
 * A spec for a tag name, from a placeholder tag and the given overrides,
 * with no triggers unless some are given.
 */
export function createPlaceholderSpec(
  tagName: string,
  options: {
    tag?: Partial<TagConfig>;
    trigger?: TriggerConfig[];
  } = {}
): Spec {
  const baseTag = createPlaceholderTagConfig({
    name: tagName,
    type: options.tag?.type,
    accountId: options.tag?.accountId,
    containerId: options.tag?.containerId,
    parameter: options.tag?.parameter
  });

  return {
    tag: {
      ...baseTag,
      ...options.tag,
      parameter: options.tag?.parameter ?? baseTag.parameter
    },
    trigger: options.trigger ?? []
  };
}
