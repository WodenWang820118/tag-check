import { Injectable, Logger } from '@nestjs/common';
import {
  BaseItem,
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  GA4_NUMERIC_ITEM_PARAMETERS
} from '@utils';
import { URL, URLSearchParams } from 'url';
import { standardPageParameterMap, standardParameterMap } from './utilities';

/** Event-level parameters moved into `ecommerce` for item events that are not recommended events. */
const DEFAULT_ECOMMERCE_PARAMETERS = ['currency', 'value'];
const ITEM_KEY_LENGTH = 2;
/** A placeholder origin for parsing relative URLs; nothing is fetched from it. */
const RELATIVE_URL_BASE = 'http://localhost';

/**
 * Rebuilds the data layer event behind a GA4 collect request so it can be
 * validated against the same spec as the data layer.
 *
 * Parameter names and types follow Google's recommended events reference
 * (https://developers.google.com/analytics/devguides/collection/ga4/reference/events):
 * `ep.` parameters are strings, `epn.` parameters are numbers, and ecommerce
 * parameters are nested under `ecommerce` as in Tag Manager's data layer
 * (https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm).
 */
@Injectable()
export class RequestProcessorService {
  private readonly logger = new Logger(RequestProcessorService.name);
  private readonly excludedEventParams = ['debug_mode'];

  /**
   * Parses the query string of a collect URL. The URL is not decoded first:
   * values such as `dl` and `dt` carry encoded `&`, `#` and `%` that would
   * otherwise split or truncate the query.
   */
  parseUrl(url: string): URLSearchParams {
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      // A relative URL ("/g/collect?..." or "?v=2&...") needs a base to
      // parse. Only the query is read, so the base is never requested.
      urlObj = new URL(url, RELATIVE_URL_BASE);
    }
    return urlObj.searchParams;
  }

  /** The event name (`en`), or an empty string. */
  extractEventName(queryParams: URLSearchParams): string {
    return queryParams.get('en') || '';
  }

  /**
   * Copies the event parameters of `queryString` onto `dataLayer` and returns
   * it: `ep.` as strings, `epn.` as numbers, `cu` as `currency` and the page
   * parameters under their GA4 names. `debug_mode` is left out.
   */
  addCustomEventParameters(
    dataLayer: Record<string, unknown>,
    queryString: string
  ): Record<string, unknown> {
    const queryParams = new URLSearchParams(queryString);
    for (const [key, val] of queryParams.entries()) {
      if (key.startsWith('ep.')) {
        const name = key.slice('ep.'.length);
        if (!this.excludedEventParams.includes(name)) {
          dataLayer[name] = val;
        }
      } else if (key.startsWith('epn.')) {
        dataLayer[key.slice('epn.'.length)] = toNumber(val);
      } else if (key === 'cu') {
        dataLayer['currency'] = val;
      } else if (key in standardPageParameterMap) {
        dataLayer[standardPageParameterMap[key]] = val;
      }
    }
    return dataLayer;
  }

  /**
   * Reads one item field that is not a standard key: `k<n>` names a custom
   * parameter, `v<n>` gives its value. Writes the result onto `item`.
   */
  processCustomField(
    field: string,
    item: BaseItem,
    customKeys: { [index: string]: string }
  ): void {
    const customKeyMatch = /^k(\d+)/.exec(field);
    const customValueMatch = /^v(\d+)/.exec(field);

    if (customKeyMatch) {
      const index = customKeyMatch[1];
      customKeys[index] = field.substring(`k${index}`.length);
    } else if (customValueMatch) {
      const index = customValueMatch[1];
      if (customKeys[index]) {
        item[customKeys[index]] = field.substring(`v${index}`.length);
      }
    } else {
      // Unknown key: keep it rather than drop data gtag.js started sending.
      item[field.slice(0, ITEM_KEY_LENGTH)] = field.slice(ITEM_KEY_LENGTH);
    }
  }

  /** Reads `pr1`, `pr2`, ... in the order they appear in the request. */
  extractItems(queryParams: URLSearchParams): BaseItem[] {
    const items: BaseItem[] = [];
    for (const [key, value] of queryParams.entries()) {
      if (/^pr\d+$/.test(key) && value) {
        items.push(this.formStandardItemObj(value));
      }
    }
    return items;
  }

  /**
   * Rebuilds the dataLayer push behind a collect URL: the event name, its
   * parameters and, for ecommerce events or events with items, an
   * `ecommerce` object. Never throws.
   */
  recomposeGA4ECEvent(url: string) {
    const queryParams = this.parseUrl(url);
    const event = this.extractEventName(queryParams);
    const dataLayer = this.addCustomEventParameters(
      { event },
      queryParams.toString()
    );
    const items = this.extractItems(queryParams);
    const ecommerceParameters = GA4_ECOMMERCE_EVENT_PARAMETERS[event];

    if (ecommerceParameters || items.length) {
      const ecommerce: Record<string, unknown> = {};
      for (const name of ecommerceParameters ?? DEFAULT_ECOMMERCE_PARAMETERS) {
        if (name in dataLayer) {
          ecommerce[name] = dataLayer[name];
          delete dataLayer[name];
        }
      }
      if (items.length) {
        ecommerce['items'] = items;
      }
      if (Object.keys(ecommerce).length) {
        dataLayer.ecommerce = ecommerce;
      }
    }

    this.logger.log(
      `recomposeGA4ECEvent-dataLayer${JSON.stringify(dataLayer)}`
    );
    return dataLayer;
  }

  /**
   * Decodes one `pr<n>` value: `~`-separated fields, each a two-letter key
   * followed by its value. gtag.js escapes a literal `~` as `~~`.
   */
  formStandardItemObj(product: string): BaseItem {
    const item: BaseItem = {};
    const customKeys: { [index: string]: string } = {};

    for (const field of splitItemFields(product)) {
      const paramName = standardParameterMap[field.slice(0, ITEM_KEY_LENGTH)];
      if (!paramName) {
        this.processCustomField(field, item, customKeys);
        continue;
      }

      const value = field.slice(ITEM_KEY_LENGTH);
      item[paramName] = GA4_NUMERIC_ITEM_PARAMETERS.includes(paramName)
        ? toNumber(value)
        : value;
    }

    return item;
  }
}

/** Splits a `pr<n>` value on `~`, reading `~~` as a literal `~`. */
function splitItemFields(product: string): string[] {
  const fields: string[] = [];
  let current = '';
  for (let i = 0; i < product.length; i++) {
    if (product[i] !== '~') {
      current += product[i];
    } else if (product[i + 1] === '~') {
      current += '~';
      i++;
    } else {
      fields.push(current);
      current = '';
    }
  }
  fields.push(current);
  return fields.filter((field) => field.length > 0);
}

/** Keeps the raw string when gtag.js sent something that is not a number. */
function toNumber(value: string): number | string {
  const parsed = Number(value);
  return value.trim() !== '' && Number.isFinite(parsed) ? parsed : value;
}
