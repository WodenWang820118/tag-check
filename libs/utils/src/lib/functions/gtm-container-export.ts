import { VariableTypeEnum } from '../enums/tag-build';
import type {
  GTMConfiguration,
  TagConfig,
  VariableConfig
} from '../types/tag-build';
import {
  getParameterListItems,
  getParameterMapValue,
  getParameterValue,
  isGTMConfiguration
} from './tag-build-contract';

export type GtmContainerExportParseResult =
  | { container: GTMConfiguration; error?: undefined }
  | { container?: undefined; error: string };

/** Lists a container export may leave out when the container has none. */
const CONTAINER_LISTS = ['tag', 'trigger', 'variable', 'builtInVariable'];
const VARIABLE_REFERENCE = /^\{\{([^{}]+)\}\}$/;

/**
 * Reads a file exported from Tag Manager (Admin > Export container), from its
 * text or an already parsed value. Missing `tag`, `trigger`, `variable` and
 * `builtInVariable` lists are treated as empty; anything else that does not
 * look like a container export is rejected with a reason a user can act on.
 */
export function parseGtmContainerExport(
  value: unknown
): GtmContainerExportParseResult {
  let parsed = value;
  if (typeof value === 'string') {
    try {
      parsed = JSON.parse(value);
    } catch {
      return { error: 'The file is not valid JSON.' };
    }
  }

  if (!isRecord(parsed) || !isRecord(parsed['containerVersion'])) {
    return {
      error:
        'The file is not a Tag Manager container export: containerVersion is missing.'
    };
  }

  const containerVersion = { ...parsed['containerVersion'] };
  for (const list of CONTAINER_LISTS) {
    containerVersion[list] ??= [];
  }
  const container = { ...parsed, containerVersion };
  if (!isGTMConfiguration(container)) {
    return {
      error:
        'The container export has an unexpected structure: check exportFormatVersion, exportTime and its tags, triggers and variables.'
    };
  }
  return { container };
}

/**
 * Returns the data layer key a `{{Variable Name}}` reference reads, or null
 * when the reference is not a single Data Layer Variable. With data layer
 * version 2 (the default) dots address nested keys; version 1 reads the name
 * as one literal key.
 */
export function getDataLayerVariablePath(
  reference: string,
  variables: readonly VariableConfig[]
): string[] | null {
  const variableName = VARIABLE_REFERENCE.exec(reference.trim())?.[1];
  const variable = variables.find(
    (candidate) =>
      candidate.name === variableName &&
      candidate.type === VariableTypeEnum.DATA_LAYER
  );
  const name = getParameterValue(variable?.parameter, 'name');
  if (!name) {
    return null;
  }
  const version = getParameterValue(variable?.parameter, 'dataLayerVersion');
  return version === '1' ? [name] : name.split('.');
}

/** What a `{{Variable Name}}` reference stands for, as far as the container says. */
export type VariableReferenceValue =
  | { kind: 'constant'; value: string }
  | { kind: 'dataLayer'; path: string };

/**
 * Resolves a `{{Variable Name}}` reference to a Constant's value or to the
 * data layer key a Data Layer Variable reads. Other variables, such as
 * custom JavaScript or lookup tables, only have a value at run time: null.
 */
export function resolveVariableReference(
  reference: string,
  variables: readonly VariableConfig[]
): VariableReferenceValue | null {
  const path = getDataLayerVariablePath(reference, variables);
  if (path) {
    return { kind: 'dataLayer', path: path.join('.') };
  }
  const variableName = VARIABLE_REFERENCE.exec(reference.trim())?.[1];
  const constant = variables.find(
    (candidate) =>
      candidate.name === variableName &&
      candidate.type === VariableTypeEnum.CONSTANT
  );
  const value = getParameterValue(constant?.parameter, 'value');
  return value ? { kind: 'constant', value } : null;
}

/**
 * The parameter rows a GA4 event tag sends: its own event parameter table
 * followed by the table of the Event Settings variable it references, if any.
 *
 * GTM exports `eventSettingsTable`; older Tag Build versions used
 * `eventParameters`. Both are read, with `eventSettingsTable` winning
 * conflicts. Tag values override shared settings.
 */
export function getGa4EventParameterRows(
  tag: TagConfig,
  variables: readonly VariableConfig[]
): { parameter: string; value: string }[] {
  return getGa4EventParameterTable(tag, variables).rows;
}

/** Reads the merged parameter rows and notes conflicting values for plan exports. */
export function getGa4EventParameterTable(
  tag: TagConfig,
  variables: readonly VariableConfig[]
): { rows: { parameter: string; value: string }[]; notes: string[] } {
  const tables = [
    ...tag.parameter.filter((entry) => entry.key === 'eventParameters'),
    ...tag.parameter.filter((entry) => entry.key === 'eventSettingsTable')
  ];
  const settingsReference = getParameterValue(
    tag.parameter,
    'eventSettingsVariable'
  );
  const settingsName = settingsReference
    ? VARIABLE_REFERENCE.exec(settingsReference.trim())?.[1]
    : undefined;
  const settingsVariable = variables.find(
    (candidate) =>
      candidate.name === settingsName &&
      candidate.type === VariableTypeEnum.EVENT_SETTINGS
  );
  const sharedTable = settingsVariable?.parameter?.find(
    (entry) => entry.key === 'eventSettingsTable'
  );
  if (sharedTable) {
    tables.push(sharedTable);
  }

  const parameters = new Map<string, { value: string; source: string }>();
  const notes: string[] = [];
  for (const table of tables) {
    const source =
      table === sharedTable
        ? 'Event Settings variable'
        : (table.key ?? 'the tag');
    for (const row of getParameterListItems(table)) {
      const parameter = getParameterMapValue(row, 'parameter');
      const value = getParameterMapValue(row, 'parameterValue');
      if (!parameter || value === undefined) {
        continue;
      }
      const existing = parameters.get(parameter);
      const keepExisting = existing && table === sharedTable;
      if (existing && existing.value !== value) {
        const kept = keepExisting ? existing : { value, source };
        const dropped = keepExisting ? { value, source } : existing;
        notes.push(
          `Parameter "${parameter}" has conflicting values in ${dropped.source} and ${kept.source}; kept ${kept.source} value "${kept.value}" instead of "${dropped.value}".`
        );
      }
      if (!keepExisting) {
        parameters.set(parameter, { value, source });
      }
    }
  }
  return {
    rows: [...parameters].map(([parameter, { value }]) => ({
      parameter,
      value
    })),
    notes
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
