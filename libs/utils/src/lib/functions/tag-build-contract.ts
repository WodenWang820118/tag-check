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

export function isParameterMap(value: unknown): value is ParameterMap {
  return (
    isRecord(value) &&
    value['type'] === 'MAP' &&
    Array.isArray(value['map']) &&
    value['map'].every(isParameter)
  );
}

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

export function isParameterWithKeyValue(
  parameter: Parameter
): parameter is ParameterWithKeyValue {
  return (
    typeof parameter.key === 'string' && typeof parameter.value === 'string'
  );
}

export function getParameterListItems(
  parameter: Parameter | null | undefined
): ParameterListItem[] {
  return Array.isArray(parameter?.list) ? parameter.list : [];
}

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

export function getParameterMapValue(
  item: ParameterListItem | null | undefined,
  key: string
): string | undefined {
  if (!isParameterMap(item)) {
    return undefined;
  }

  return getParameterValue(item.map, key);
}

export function isTrigger(value: unknown): value is Trigger {
  return (
    isRecord(value) &&
    typeof value['name'] === 'string' &&
    typeof value['triggerId'] === 'string'
  );
}

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

export function isSpec(value: unknown): value is Spec {
  return (
    isRecord(value) &&
    isTagConfig(value['tag']) &&
    Array.isArray(value['trigger']) &&
    value['trigger'].every(isTriggerConfig)
  );
}

export function isSpecArray(value: unknown): value is Spec[] {
  return Array.isArray(value) && value.every(isSpec);
}

export function isStrictDataLayerEvent(
  value: unknown
): value is StrictDataLayerEvent {
  return isRecord(value) && typeof value['event'] === 'string';
}

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

export function isGTMConfiguration(value: unknown): value is GTMConfiguration {
  return (
    isRecord(value) &&
    typeof value['exportFormatVersion'] === 'number' &&
    typeof value['exportTime'] === 'string' &&
    isGTMContainerVersion(value['containerVersion'])
  );
}

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
