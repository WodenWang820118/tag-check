import { describe, expect, it } from 'vitest';
import {
  createPlaceholderSpec,
  createPlaceholderTagConfig,
  getParameterListItems,
  getParameterMapValue,
  getParameterValue,
  isGTMConfiguration,
  isParameter,
  isParameterListItem,
  isParameterMap,
  isParameterWithKeyValue,
  isSpec,
  isSpecArray,
  isStrictDataLayerEvent,
  isStrictDataLayerEventArray,
  isTagConfig,
  isTrigger,
  isTriggerConfig,
  isVariableConfig,
  validateGTMImportReadiness
} from './tag-build-contract';
import { TagTypeEnum } from '../enums/tag-build';

const accountId = '123';
const containerId = '456';

function makeTag(overrides: Record<string, unknown> = {}) {
  return {
    name: 'tag',
    type: TagTypeEnum.GAAWE,
    accountId,
    containerId,
    parameter: [],
    ...overrides
  };
}

function makeTrigger(overrides: Record<string, unknown> = {}) {
  return {
    name: 'trigger',
    type: 'CUSTOM_EVENT',
    accountId,
    containerId,
    ...overrides
  };
}

function makeVariable(overrides: Record<string, unknown> = {}) {
  return {
    name: 'variable',
    type: 'v',
    accountId,
    containerId,
    ...overrides
  };
}

function makeContainer(overrides: Record<string, unknown> = {}) {
  return {
    path: `accounts/${accountId}/containers/${containerId}`,
    accountId,
    containerId,
    name: 'container',
    publicId: 'GTM-ABC123',
    usageContext: ['WEB'],
    fingerprint: 'fp',
    tagManagerUrl: 'https://tagmanager.google.com',
    features: {},
    tagIds: ['1'],
    ...overrides
  };
}

function makeContainerVersion(overrides: Record<string, unknown> = {}) {
  return {
    path: `accounts/${accountId}/containers/${containerId}/versions/789`,
    accountId,
    containerId,
    containerVersionId: '789',
    container: makeContainer(),
    variable: [makeVariable()],
    builtInVariable: [makeVariable({ name: 'built-in' })],
    trigger: [makeTrigger()],
    tag: [makeTag()],
    fingerprint: 'fp',
    tagManagerUrl: 'https://tagmanager.google.com',
    ...overrides
  };
}

function makeGTMExport(overrides: Record<string, unknown> = {}) {
  return {
    exportFormatVersion: 2,
    exportTime: '2024-01-01',
    containerVersion: makeContainerVersion(),
    ...overrides
  };
}

describe('isParameter', () => {
  it('accepts a minimal parameter with only type', () => {
    expect(isParameter({ type: 'TEMPLATE' })).toBe(true);
  });

  it('accepts a parameter with key/value/list', () => {
    expect(
      isParameter({
        type: 'TEMPLATE',
        key: 'k',
        value: 'v',
        list: [{ type: 'MAP', map: [{ type: 'TEMPLATE', value: 'x' }] }]
      })
    ).toBe(true);
  });

  it.each([
    [null, 'null'],
    [undefined, 'undefined'],
    ['string', 'string'],
    [42, 'number']
  ])('rejects non-records (%s)', (input, _label) => {
    expect(isParameter(input)).toBe(false);
  });

  it('rejects when type is missing or not a string', () => {
    expect(isParameter({})).toBe(false);
    expect(isParameter({ type: 1 })).toBe(false);
  });

  it('rejects non-string key/value', () => {
    expect(isParameter({ type: 't', key: 1 })).toBe(false);
    expect(isParameter({ type: 't', value: 1 })).toBe(false);
  });

  it('rejects non-array list', () => {
    expect(isParameter({ type: 't', list: 'oops' })).toBe(false);
  });
});

describe('isParameterMap', () => {
  it('accepts a MAP with valid parameter children', () => {
    expect(
      isParameterMap({
        type: 'MAP',
        map: [{ type: 'TEMPLATE', key: 'k', value: 'v' }]
      })
    ).toBe(true);
  });

  it('rejects when type is not MAP', () => {
    expect(isParameterMap({ type: 'TEMPLATE', map: [] })).toBe(false);
  });

  it('rejects when map is missing or not an array', () => {
    expect(isParameterMap({ type: 'MAP' })).toBe(false);
    expect(isParameterMap({ type: 'MAP', map: 'no' })).toBe(false);
  });
});

describe('isParameterListItem', () => {
  it('accepts a parameter map', () => {
    expect(isParameterListItem({ type: 'MAP', map: [] })).toBe(true);
  });

  it('accepts a list item with type and value', () => {
    expect(
      isParameterListItem({ type: 'TRIGGER_REFERENCE', value: 't1' })
    ).toBe(true);
  });

  it('accepts a list item with type and map', () => {
    expect(
      isParameterListItem({
        type: 'CUSTOM',
        map: [{ type: 'TEMPLATE', key: 'k', value: 'v' }]
      })
    ).toBe(true);
  });

  it('rejects non-records and missing type', () => {
    expect(isParameterListItem(null)).toBe(false);
    expect(isParameterListItem({})).toBe(false);
  });

  it('rejects non-string value', () => {
    expect(isParameterListItem({ type: 't', value: 1 })).toBe(false);
  });
});

describe('isParameterWithKeyValue', () => {
  it('accepts when key and value are strings', () => {
    expect(isParameterWithKeyValue({ type: 't', key: 'k', value: 'v' })).toBe(
      true
    );
  });

  it('rejects when key or value is missing', () => {
    expect(isParameterWithKeyValue({ type: 't', key: 'k' })).toBe(false);
    expect(isParameterWithKeyValue({ type: 't', value: 'v' })).toBe(false);
  });
});

describe('getParameterListItems', () => {
  it('returns the list when present', () => {
    const list = [{ type: 'MAP', map: [] }];
    expect(getParameterListItems({ type: 't', list })).toBe(list);
  });

  it('returns an empty array when list is missing or null/undefined input', () => {
    expect(getParameterListItems({ type: 't' })).toEqual([]);
    expect(getParameterListItems(null)).toEqual([]);
    expect(getParameterListItems(undefined)).toEqual([]);
  });
});

describe('getParameterValue', () => {
  const params = [
    { type: 'TEMPLATE', key: 'k1', value: 'v1' },
    { type: 'BOOLEAN', key: 'k2', value: 'true' },
    { type: 'TEMPLATE', key: 'k3' }
  ];

  it('returns the value matching key', () => {
    expect(getParameterValue(params, 'k1')).toBe('v1');
  });

  it('respects type filter when provided', () => {
    expect(getParameterValue(params, 'k2', 'BOOLEAN')).toBe('true');
    expect(getParameterValue(params, 'k2', 'TEMPLATE')).toBeUndefined();
  });

  it('returns undefined when key is missing or value is non-string', () => {
    expect(getParameterValue(params, 'missing')).toBeUndefined();
    expect(getParameterValue(params, 'k3')).toBeUndefined();
  });

  it('returns undefined for null/undefined parameters input', () => {
    expect(getParameterValue(null, 'k')).toBeUndefined();
    expect(getParameterValue(undefined, 'k')).toBeUndefined();
  });
});

describe('getParameterMapValue', () => {
  it('reads a value from a parameter map', () => {
    const item = {
      type: 'MAP',
      map: [{ type: 'TEMPLATE', key: 'k', value: 'v' }]
    };
    expect(getParameterMapValue(item, 'k')).toBe('v');
  });

  it('returns undefined when item is not a map', () => {
    expect(
      getParameterMapValue({ type: 'TEMPLATE', value: 'v' }, 'k')
    ).toBeUndefined();
    expect(getParameterMapValue(null, 'k')).toBeUndefined();
  });
});

describe('isTrigger', () => {
  it('accepts a trigger reference with name and triggerId', () => {
    expect(isTrigger({ name: 't', triggerId: '1' })).toBe(true);
  });

  it('rejects missing or non-string fields', () => {
    expect(isTrigger({ name: 't' })).toBe(false);
    expect(isTrigger({ triggerId: '1' })).toBe(false);
    expect(isTrigger(null)).toBe(false);
  });
});

describe('isTriggerConfig', () => {
  it('accepts a minimal valid trigger config', () => {
    expect(isTriggerConfig(makeTrigger())).toBe(true);
  });

  it('accepts optional fields when correctly typed', () => {
    expect(
      isTriggerConfig(
        makeTrigger({
          triggerId: '1',
          firingTriggerId: ['a', 'b'],
          parameter: [{ type: 't' }]
        })
      )
    ).toBe(true);
  });

  it('rejects when required fields are missing', () => {
    expect(isTriggerConfig({ ...makeTrigger(), name: undefined })).toBe(false);
    expect(isTriggerConfig({ ...makeTrigger(), accountId: 1 })).toBe(false);
  });

  it('rejects when firingTriggerId is not a string array', () => {
    expect(isTriggerConfig(makeTrigger({ firingTriggerId: [1, 2] }))).toBe(
      false
    );
  });

  it('rejects when parameter is not an array of valid parameters', () => {
    expect(
      isTriggerConfig(makeTrigger({ parameter: [{ noType: true }] }))
    ).toBe(false);
  });
});

describe('isTagConfig', () => {
  it('accepts a minimal valid tag config', () => {
    expect(isTagConfig(makeTag())).toBe(true);
  });

  it('rejects when parameter is missing', () => {
    expect(isTagConfig({ ...makeTag(), parameter: undefined })).toBe(false);
  });

  it('rejects when firingTriggerId is not string[] or tagFiringOption is not string', () => {
    expect(isTagConfig(makeTag({ firingTriggerId: [1] }))).toBe(false);
    expect(isTagConfig(makeTag({ tagFiringOption: 1 }))).toBe(false);
  });
});

describe('isVariableConfig', () => {
  it('accepts a minimal valid variable config', () => {
    expect(isVariableConfig(makeVariable())).toBe(true);
  });

  it('rejects when parameter is invalid', () => {
    expect(isVariableConfig(makeVariable({ parameter: 'x' }))).toBe(false);
    expect(isVariableConfig(makeVariable({ parameter: [{}] }))).toBe(false);
  });
});

describe('isSpec / isSpecArray', () => {
  it('accepts a Spec with tag + trigger array', () => {
    const spec = { tag: makeTag(), trigger: [makeTrigger()] };
    expect(isSpec(spec)).toBe(true);
    expect(isSpecArray([spec, spec])).toBe(true);
  });

  it('rejects when tag or trigger entries are invalid', () => {
    expect(isSpec({ tag: makeTag(), trigger: [{}] })).toBe(false);
    expect(isSpec({ trigger: [] })).toBe(false);
    expect(isSpecArray([{}])).toBe(false);
    expect(isSpecArray('no')).toBe(false);
  });
});

describe('isStrictDataLayerEvent / isStrictDataLayerEventArray', () => {
  it('accepts an event with a string event field', () => {
    expect(isStrictDataLayerEvent({ event: 'add_to_cart' })).toBe(true);
  });

  it('rejects when event is missing or not a string', () => {
    expect(isStrictDataLayerEvent({})).toBe(false);
    expect(isStrictDataLayerEvent({ event: 1 })).toBe(false);
  });

  it('validates arrays', () => {
    expect(isStrictDataLayerEventArray([{ event: 'a' }, { event: 'b' }])).toBe(
      true
    );
    expect(isStrictDataLayerEventArray([{ event: 'a' }, {}])).toBe(false);
  });
});

describe('isGTMConfiguration', () => {
  it('accepts a well-formed GTM export', () => {
    expect(isGTMConfiguration(makeGTMExport())).toBe(true);
  });

  it('rejects when exportFormatVersion or exportTime are wrong types', () => {
    expect(
      isGTMConfiguration(makeGTMExport({ exportFormatVersion: '2' }))
    ).toBe(false);
    expect(isGTMConfiguration(makeGTMExport({ exportTime: 1 }))).toBe(false);
  });

  it('rejects when containerVersion arrays contain invalid items', () => {
    expect(
      isGTMConfiguration(
        makeGTMExport({
          containerVersion: makeContainerVersion({ tag: [{}] })
        })
      )
    ).toBe(false);
  });
});

describe('validateGTMImportReadiness', () => {
  it('returns canImport=true with no issues for a valid export', () => {
    const result = validateGTMImportReadiness(makeGTMExport());
    expect(result.canImport).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it('returns canImport=false when value is not a GTM configuration', () => {
    const result = validateGTMImportReadiness({});
    expect(result.canImport).toBe(false);
    expect(result.issues).toContain(
      'Output is not a GTM container export JSON structure.'
    );
  });

  it('flags wrong exportFormatVersion and missing exportTime', () => {
    const result = validateGTMImportReadiness(
      makeGTMExport({ exportFormatVersion: 1, exportTime: '   ' })
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'exportFormatVersion must be 2 for GTM import.',
        'exportTime must be present.'
      ])
    );
  });

  it('flags missing required containerVersion fields', () => {
    const result = validateGTMImportReadiness(
      makeGTMExport({
        containerVersion: makeContainerVersion({ fingerprint: '' })
      })
    );
    expect(result.issues).toContain(
      'containerVersion.fingerprint must be present.'
    );
  });

  it('flags container metadata mismatches and bad publicId', () => {
    const badContainer = makeContainer({
      accountId: 'other',
      containerId: 'mismatch',
      publicId: 'NOT-A-GTM',
      usageContext: ['SERVER']
    });
    const result = validateGTMImportReadiness(
      makeGTMExport({
        containerVersion: makeContainerVersion({ container: badContainer })
      })
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'container accountId must match containerVersion accountId.',
        'container containerId must match containerVersion containerId.',
        'container publicId must look like a GTM container ID.',
        'container usageContext must include WEB.'
      ])
    );
  });

  it('flags bad container path and version path', () => {
    const result = validateGTMImportReadiness(
      makeGTMExport({
        containerVersion: makeContainerVersion({
          path: 'wrong/path',
          container: makeContainer({ path: 'wrong' })
        })
      })
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'container path must match accountId and containerId.',
        'containerVersion path must match accountId, containerId, and version ID.'
      ])
    );
  });

  it('flags tag/trigger/variable items whose accountId or containerId mismatch', () => {
    const result = validateGTMImportReadiness(
      makeGTMExport({
        containerVersion: makeContainerVersion({
          tag: [makeTag({ accountId: 'x' })],
          trigger: [makeTrigger({ containerId: 'y' })]
        })
      })
    );
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'tag[0].accountId must match the container.',
        'trigger[0].containerId must match the container.'
      ])
    );
  });

  it('emits warnings when there are no tags or triggers', () => {
    const result = validateGTMImportReadiness(
      makeGTMExport({
        containerVersion: makeContainerVersion({ tag: [], trigger: [] })
      })
    );
    expect(result.warnings).toEqual(
      expect.arrayContaining([
        'The export has no tags.',
        'The export has no triggers.'
      ])
    );
  });

  it('warns when container has no tag IDs', () => {
    const result = validateGTMImportReadiness(
      makeGTMExport({
        containerVersion: makeContainerVersion({
          container: makeContainer({ tagIds: [] })
        })
      })
    );
    expect(result.warnings).toContain('The export has no container tag IDs.');
  });
});

describe('createPlaceholderTagConfig', () => {
  it('uses defaults for type, accountId, containerId, parameter', () => {
    const tag = createPlaceholderTagConfig({ name: 'my-tag' });
    expect(tag).toEqual({
      name: 'my-tag',
      type: TagTypeEnum.GAAWE,
      accountId: '',
      containerId: '',
      parameter: []
    });
  });

  it('respects explicit overrides', () => {
    const param = [{ type: 't', key: 'k', value: 'v' }];
    const tag = createPlaceholderTagConfig({
      name: 'my-tag',
      type: TagTypeEnum.HTML,
      accountId: '1',
      containerId: '2',
      parameter: param
    });
    expect(tag.type).toBe(TagTypeEnum.HTML);
    expect(tag.accountId).toBe('1');
    expect(tag.containerId).toBe('2');
    expect(tag.parameter).toBe(param);
  });
});

describe('createPlaceholderSpec', () => {
  it('creates a Spec with placeholder tag and empty triggers by default', () => {
    const spec = createPlaceholderSpec('my-tag');
    expect(spec.tag.name).toBe('my-tag');
    expect(spec.tag.type).toBe(TagTypeEnum.GAAWE);
    expect(spec.trigger).toEqual([]);
  });

  it('merges tag overrides and respects supplied triggers', () => {
    const trigger = makeTrigger();
    const spec = createPlaceholderSpec('t', {
      tag: { type: TagTypeEnum.HTML, accountId: '1' },
      trigger: [trigger]
    });
    expect(spec.tag.type).toBe(TagTypeEnum.HTML);
    expect(spec.tag.accountId).toBe('1');
    expect(spec.trigger).toEqual([trigger]);
  });

  it('preserves explicitly supplied parameter overrides', () => {
    const parameter = [{ type: 't', key: 'k', value: 'v' }];
    const spec = createPlaceholderSpec('t', { tag: { parameter } });
    expect(spec.tag.parameter).toBe(parameter);
  });
});
