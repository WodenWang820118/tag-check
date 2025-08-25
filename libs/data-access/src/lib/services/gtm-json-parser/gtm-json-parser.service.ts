import { Injectable } from '@angular/core';
import {
  GTMConfiguration,
  Parameter,
  ParameterMap,
  Spec,
  TagConfig
} from '@utils';
// TODO: doesn't extract the variables and triggers
// TODO: how to be compatible with the specs? Since original specs doesn't have trigger information
@Injectable({
  providedIn: 'root'
})
export class GtmJsonParserService {
  /**
   * Parse a GTM container export JSON string and convert GA4 event tags into Spec[]
   */
  parse(data: string): Spec[] {
    const json = JSON.parse(data) as GTMConfiguration;
    const result = this.fromGtm(json);
    console.log('Parsed GTM JSON to Specs: ', result);
    return result;
  }

  /**
   * Convert a GTM container export object to Spec[] by mapping GA4 Event tags (gaawe)
   */
  fromGtm(config: GTMConfiguration): Spec[] {
    const tags = config?.containerVersion?.tag ?? [];
    console.log('tags: ', tags);
    if (!Array.isArray(tags)) return [];

    // Only GA4 event tags
    const ga4EventTags = (tags as TagConfig[]).filter(
      (t) =>
        String((t as unknown as { type?: string }).type)?.toLowerCase?.() ===
        'gaawe'
    );

    return ga4EventTags
      .map((tag) => this.tagToSpec(tag))
      .filter((s): s is Spec => !!s);
  }

  private tagToSpec(tag: TagConfig): Spec | null {
    const params = (tag.parameter ?? []) as Parameter[];
    const eventName = this.findTemplateValue(params, 'eventName');
    if (!eventName) return null;

    const eventParams = this.findListMaps(params, 'eventParameters');
    const spec: Spec = { event: eventName };
    const ecommerce: Record<string, unknown> = {};

    for (const m of eventParams) {
      const key = this.getMapField(m, 'parameter');
      const rawValue = this.getMapField(m, 'parameterValue');
      if (!key) continue;
      const value = this.unwrapTemplate(rawValue);

      if (key.startsWith('ecommerce.')) {
        const subKey = key.substring('ecommerce.'.length);
        if (subKey) this.setByPath(ecommerce, subKey, value);
      } else if (key === 'ecommerce') {
        // If someone provided a direct ecommerce key, try to assign value as-is
        (spec as Record<string, unknown>)['ecommerce'] = value;
      } else if (key !== 'event') {
        // Place non-ecommerce keys at the same level as ecommerce
        this.setByPath(spec as Record<string, unknown>, key, value);
      }
    }

    if (Object.keys(ecommerce).length) {
      (spec as Record<string, unknown>)['ecommerce'] = ecommerce;
    }

    return spec;
  }

  private setByPath(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    if (!path) return;
    const parts = path.split('.');
    let current: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const next = current[key];
      if (next == null || typeof next !== 'object' || Array.isArray(next)) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    current[last] = value;
  }

  private findTemplateValue(
    parameters: Parameter[],
    key: string
  ): string | null {
    const p = parameters.find((pm) => pm.key === key);
    if (!p) return null;
    return this.unwrapTemplate(p.value ?? null) as string | null;
  }

  private findListMaps(parameters: Parameter[], key: string): ParameterMap[] {
    const p = parameters.find((pm) => pm.key === key && pm.type === 'LIST');
    return (p?.list ?? []) as ParameterMap[];
  }

  private getMapField(map: ParameterMap, field: string): string | null {
    const entry = (map.map ?? []).find((m) => m.key === field);
    return this.unwrapTemplate(entry?.value ?? null) as string | null;
  }

  /**
   * If the value is a GTM template like {{DLV - ecommerce.currency}}, return the inner value.
   * Otherwise return the original value.
   */
  private unwrapTemplate(val: unknown): unknown {
    if (typeof val !== 'string') return val ?? null;
    const trimmed = val.trim();
    const regex = /^\{\{\s*(?:DLV\s*-\s*)?(.+?)\s*\}\}$/;
    const m = regex.exec(trimmed);
    if (m) return m[1];
    return trimmed;
  }
}
