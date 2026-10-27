/**
 * Reads a GA4 `/g/collect` request URL for people: its event, event
 * parameters, items and page, and everything else gtag.js sent.
 *
 * Google does not document the `/g/collect` wire format. The keys below were
 * read from requests recorded from the official gtag.js; parameter and item
 * names follow Google's recommended events reference.
 *
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */

/**
 * Two-letter keys gtag.js uses inside `pr1`, `pr2`, ... for item parameters
 * (recorded from gtag.js). Custom item parameters come as `k<n><name>` /
 * `v<n><value>` pairs.
 */
const ITEM_KEYS: Readonly<Record<string, string>> = {
  id: 'item_id',
  nm: 'item_name',
  af: 'affiliation',
  cp: 'coupon',
  ds: 'discount',
  lp: 'index',
  br: 'item_brand',
  ca: 'item_category',
  c2: 'item_category2',
  c3: 'item_category3',
  c4: 'item_category4',
  c5: 'item_category5',
  li: 'item_list_id',
  ln: 'item_list_name',
  va: 'item_variant',
  lo: 'location_id',
  pr: 'price',
  qt: 'quantity',
  cn: 'creative_name',
  cs: 'creative_slot',
  pi: 'promotion_id',
  pn: 'promotion_name'
};

/** Page parameters gtag.js sends as request-level keys (recorded from gtag.js). */
const PAGE_KEYS: Readonly<Record<string, string>> = {
  dl: 'page_location',
  dp: 'page_path',
  dr: 'page_referrer',
  dt: 'page_title'
};

/** An event parameter as GA4 receives it. */
export type Ga4CollectParameter = {
  name: string;
  value: string;
  /** Sent as a number (`epn.`), not text (`ep.`). */
  numeric: boolean;
};

/** What a GA4 `/g/collect` request sent; see summarizeGa4Collect. */
export type Ga4CollectSummary = {
  /** `en`, or null when missing. */
  eventName: string | null;
  /** `tid`, or null when missing. */
  measurementId: string | null;
  /** `ep.*` and `epn.*`, and the currency `cu` sends, in request order. */
  parameters: Ga4CollectParameter[];
  /** `pr1`, `pr2`, ... by item parameter name, in item order. */
  items: Record<string, string>[];
  /** Page location, path, referrer and title. */
  page: { name: string; value: string }[];
  /** `_dbg`: sent in debug mode, which DebugView and Tag Assistant show. */
  debug: boolean;
  /** Every other key: client, session, consent and browser details. */
  other: { key: string; value: string }[];
};

/**
 * Splits a `pr<n>` value into its `~`-separated fields; gtag.js escapes a
 * literal `~` as `~~`.
 */
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

/** Decodes one `pr<n>` value into item parameters. */
function decodeItem(product: string): Record<string, string> {
  const item: Record<string, string> = {};
  const customKeys: Record<string, string> = {};
  for (const field of splitItemFields(product)) {
    const name = ITEM_KEYS[field.slice(0, 2)];
    const custom = /^([kv])(\d+)/.exec(field);
    if (name) {
      item[name] = field.slice(2);
    } else if (custom?.[1] === 'k') {
      customKeys[custom[2]] = field.slice(custom[0].length);
    } else if (custom?.[1] === 'v' && customKeys[custom[2]]) {
      item[customKeys[custom[2]]] = field.slice(custom[0].length);
    }
  }
  return item;
}

/**
 * Reads a `/g/collect` request URL; null when it is not a URL with a query.
 * Values are kept as sent (decoded from the URL), so nothing is lost.
 */
export function summarizeGa4Collect(url: string): Ga4CollectSummary | null {
  let params: URLSearchParams;
  try {
    params = new URL(url, 'http://localhost').searchParams;
  } catch {
    return null;
  }
  if ([...params.keys()].length === 0) {
    return null;
  }
  const summary: Ga4CollectSummary = {
    eventName: params.get('en'),
    measurementId: params.get('tid'),
    parameters: [],
    items: [],
    page: [],
    debug: params.has('_dbg'),
    other: []
  };
  const items: [number, Record<string, string>][] = [];
  for (const [key, value] of params) {
    const product = /^pr(\d+)$/.exec(key);
    if (key === 'en' || key === 'tid' || key === '_dbg') {
      continue;
    } else if (key.startsWith('ep.')) {
      summary.parameters.push({ name: key.slice(3), value, numeric: false });
    } else if (key.startsWith('epn.')) {
      summary.parameters.push({ name: key.slice(4), value, numeric: true });
    } else if (key === 'cu') {
      summary.parameters.push({ name: 'currency', value, numeric: false });
    } else if (product) {
      items.push([Number(product[1]), decodeItem(value)]);
    } else if (PAGE_KEYS[key]) {
      summary.page.push({ name: PAGE_KEYS[key], value });
    } else {
      summary.other.push({ key, value });
    }
  }
  summary.items = items.sort((a, b) => a[0] - b[0]).map(([, item]) => item);
  return summary;
}
