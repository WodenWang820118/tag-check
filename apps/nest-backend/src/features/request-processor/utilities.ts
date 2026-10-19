/**
 * Two-letter keys gtag.js uses inside `pr1`, `pr2`, ... for GA4 item
 * parameters, mapped to the item parameter names in Google's recommended
 * events reference
 * (https://developers.google.com/analytics/devguides/collection/ga4/reference/events).
 *
 * Google does not document the keys themselves; they were read from requests
 * recorded from the official gtag.js (gtag-collect-hits.spec-helpers.ts).
 * Custom item parameters are sent as `k<n><name>` / `v<n><value>` pairs.
 */
export const standardParameterMap: { [key: string]: string } = {
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

/**
 * Page parameters gtag.js sends as request-level keys. `page_path` is not in
 * Google's GA4 parameter docs, but GTM event tags still set it and gtag.js
 * sends it as `dp` (recorded from a GTM preview session).
 */
export const standardPageParameterMap: { [key: string]: string } = {
  dl: 'page_location',
  dp: 'page_path',
  dr: 'page_referrer',
  dt: 'page_title'
};
