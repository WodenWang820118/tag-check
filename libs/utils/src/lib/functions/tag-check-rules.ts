/**
 * Line-based reader and writer for TagCheck validation rules stored in a GTM GA4
 * event tag's `notes` field.
 *
 * Rules are recorded so a container export carries validation expectations
 * back into TagCheck during import, and out into measurement plans during
 * extraction.
 */

import type { StrictDataLayerEvent } from '../types/tag-check';
import type { ParameterRule } from './measurement-plan';

export const RULES_HEADER = 'TagCheck rules:';

/**
 * Serializes event rules and item rules into Tag Manager GA4 event tag notes.
 * Returns `undefined` if there are no non-`any` rules so a plan without rules produces no notes.
 */
export function formatTagCheckNotes(
  eventRules: readonly ParameterRule[],
  itemRules: readonly ParameterRule[] = []
): string | undefined {
  const lines: string[] = [];

  for (const rule of eventRules) {
    if (rule.kind === 'any') {
      continue;
    }
    lines.push(formatRuleNoteLine(rule.name, rule));
  }

  for (const rule of itemRules) {
    if (rule.kind === 'any') {
      continue;
    }
    lines.push(formatRuleNoteLine(`items.${rule.name}`, rule));
  }

  if (lines.length === 0) {
    return undefined;
  }

  return `${RULES_HEADER}\n${lines.join('\n')}`;
}

function formatRuleNoteLine(path: string, rule: ParameterRule): string {
  if (rule.kind === 'pattern') {
    const flags = rule.flags ? rule.flags : '';
    return `${path} ~ /${rule.pattern}/${flags}`;
  }
  if (rule.kind === 'equals') {
    if (typeof rule.value === 'string') {
      return `${path} = ${JSON.stringify(rule.value)}`;
    }
    return `${path} = ${String(rule.value)}`;
  }
  return path;
}

/**
 * Reads TagCheck parameter rules from a tag's GTM `notes` field.
 * Expects the section starting with `TagCheck rules:`.
 */
export function readTagCheckRules(notes: string | undefined): {
  eventRules: ParameterRule[];
  itemRules: ParameterRule[];
} {
  const eventRules: ParameterRule[] = [];
  const itemRules: ParameterRule[] = [];

  if (!notes) {
    return { eventRules, itemRules };
  }

  const lines = notes.split(/\r?\n/);
  const headerIndex = lines.findIndex(
    (line) => line.trim().toLowerCase() === RULES_HEADER.toLowerCase()
  );

  if (headerIndex === -1) {
    return { eventRules, itemRules };
  }

  for (let i = headerIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.length === 0) {
      continue;
    }
    const match = /^(items\.)?([a-zA-Z0-9_]+)\s*(=|~)\s*(.+)$/.exec(line);
    if (!match) {
      if (line.endsWith(':')) {
        break;
      }
      continue;
    }

    const isItem = Boolean(match[1]);
    const name = match[2];
    const op = match[3];
    const rawValue = match[4].trim();

    if (op === '~') {
      const lastSlash = rawValue.lastIndexOf('/');
      if (rawValue.startsWith('/') && lastSlash > 0) {
        const pattern = rawValue.slice(1, lastSlash);
        const flags = rawValue.slice(lastSlash + 1).trim();
        const rule: ParameterRule = {
          kind: 'pattern',
          name,
          pattern,
          ...(flags.length > 0 ? { flags } : {})
        };
        if (isItem) {
          itemRules.push(rule);
        } else {
          eventRules.push(rule);
        }
      }
      continue;
    }

    if (op === '=') {
      let value: string | number | boolean;
      if (
        rawValue.length >= 2 &&
        rawValue.startsWith('"') &&
        rawValue.endsWith('"')
      ) {
        try {
          value = JSON.parse(rawValue) as string;
        } catch {
          value = rawValue.slice(1, -1);
        }
      } else if (rawValue === 'true') {
        value = true;
      } else if (rawValue === 'false') {
        value = false;
      } else if (/^-?\d+(?:\.\d+)?$/.test(rawValue)) {
        value = Number(rawValue);
      } else {
        value = rawValue;
      }

      const rule: ParameterRule = {
        kind: 'equals',
        name,
        value
      };
      if (isItem) {
        itemRules.push(rule);
      } else {
        eventRules.push(rule);
      }
    }
  }

  return { eventRules, itemRules };
}

/**
 * Extracts event and item parameter rules from a TagCheck StrictDataLayerEvent spec.
 */
export function extractTagCheckRulesFromSpec(spec: StrictDataLayerEvent): {
  eventRules: ParameterRule[];
  itemRules: ParameterRule[];
} {
  const eventRules: ParameterRule[] = [];
  const itemRules: ParameterRule[] = [];

  for (const [key, value] of Object.entries(spec)) {
    if (key === 'event') {
      continue;
    }
    if (key === 'ecommerce' && isRecord(value)) {
      for (const [ecomKey, ecomVal] of Object.entries(value)) {
        if (ecomKey === 'items' && Array.isArray(ecomVal)) {
          if (ecomVal.length > 0 && isRecord(ecomVal[0])) {
            for (const [itemKey, itemVal] of Object.entries(ecomVal[0])) {
              const rule = specValueToRule(itemKey, itemVal);
              if (rule && rule.kind !== 'any') {
                itemRules.push(rule);
              }
            }
          }
          continue;
        }
        const rule = specValueToRule(ecomKey, ecomVal);
        if (rule && rule.kind !== 'any') {
          eventRules.push(rule);
        }
      }
      continue;
    }
    if (key === 'items' && Array.isArray(value)) {
      if (value.length > 0 && isRecord(value[0])) {
        for (const [itemKey, itemVal] of Object.entries(value[0])) {
          const rule = specValueToRule(itemKey, itemVal);
          if (rule && rule.kind !== 'any') {
            itemRules.push(rule);
          }
        }
      }
      continue;
    }
    const rule = specValueToRule(key, value);
    if (rule && rule.kind !== 'any') {
      eventRules.push(rule);
    }
  }

  return { eventRules, itemRules };
}

/**
 * Converts a spec property value to a {@link ParameterRule}.
 */
export function specValueToRule(
  name: string,
  val: unknown
): ParameterRule | null {
  if (typeof val === 'string') {
    if (val.startsWith('$') || val.startsWith('{{')) {
      return { kind: 'any', name };
    }
    if (val.length > 1 && val.startsWith('/') && val.lastIndexOf('/') > 0) {
      const lastSlash = val.lastIndexOf('/');
      const pattern = val.slice(1, lastSlash);
      const flags = val.slice(lastSlash + 1);
      return {
        kind: 'pattern',
        name,
        pattern,
        ...(flags ? { flags } : {})
      };
    }
    return { kind: 'equals', name, value: val };
  }
  if (typeof val === 'number' || typeof val === 'boolean') {
    return { kind: 'equals', name, value: val };
  }
  return null;
}

/**
 * Converts a {@link ParameterRule} to its spec value representation.
 */
export function ruleToSpecValue(rule: ParameterRule): unknown {
  if (rule.kind === 'equals') {
    return rule.value;
  }
  if (rule.kind === 'pattern') {
    return rule.flags ? `/${rule.pattern}/${rule.flags}` : `/${rule.pattern}/`;
  }
  return rule.name.startsWith('$') ? rule.name : `$${rule.name}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
