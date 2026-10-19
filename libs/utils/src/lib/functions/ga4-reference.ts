/**
 * Google Analytics 4 rules transcribed from Google's official documentation.
 * Each constant links to its source page so it can be re-checked when Google
 * updates the docs (last checked 2026-10-19).
 */

/**
 * Event names, event parameter names and item parameter names are limited to
 * 40 characters.
 * @see https://support.google.com/analytics/answer/9267744
 */
export const GA4_EVENT_NAME_MAX_LENGTH = 40;

/**
 * "Event names must start with a letter. Use only letters, numbers, and
 * underscores. Don't use spaces." Non-English letters are allowed.
 * @see https://support.google.com/analytics/answer/13316687
 */
const GA4_EVENT_NAME_PATTERN = /^\p{L}[\p{L}\p{N}_]*$/u;

/**
 * Returns why an event name breaks GA4's naming rules, or an empty array when
 * it is valid. Event names are case sensitive, so the name is not normalised.
 *
 * Reserved names such as `page_view` are not reported: Google reserves them for
 * automatically collected events, which are exactly what a site sends.
 * @see https://support.google.com/analytics/answer/13316687
 */
export function getGa4EventNameIssues(eventName: string): string[] {
  const issues: string[] = [];
  if (!GA4_EVENT_NAME_PATTERN.test(eventName)) {
    issues.push(
      'must start with a letter and use only letters, numbers and underscores'
    );
  }
  if ([...eventName].length > GA4_EVENT_NAME_MAX_LENGTH) {
    issues.push(`must be at most ${GA4_EVENT_NAME_MAX_LENGTH} characters`);
  }
  return issues;
}

/**
 * Event-level parameters of the recommended ecommerce events. With Tag Manager
 * these are pushed inside the data layer's `ecommerce` object.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 * @see https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 */
export const GA4_ECOMMERCE_EVENT_PARAMETERS: Readonly<
  Record<string, readonly string[]>
> = {
  add_payment_info: ['currency', 'value', 'coupon', 'payment_type', 'items'],
  add_shipping_info: ['currency', 'value', 'coupon', 'shipping_tier', 'items'],
  add_to_cart: ['currency', 'value', 'items'],
  add_to_wishlist: ['currency', 'value', 'items'],
  begin_checkout: ['currency', 'value', 'coupon', 'items'],
  purchase: [
    'currency',
    'value',
    'customer_type',
    'transaction_id',
    'coupon',
    'shipping',
    'tax',
    'items'
  ],
  refund: [
    'currency',
    'transaction_id',
    'value',
    'coupon',
    'shipping',
    'tax',
    'items'
  ],
  remove_from_cart: ['currency', 'value', 'items'],
  select_item: ['item_list_id', 'item_list_name', 'items'],
  select_promotion: [
    'creative_name',
    'creative_slot',
    'promotion_id',
    'promotion_name',
    'items'
  ],
  view_cart: ['currency', 'value', 'items'],
  view_item: ['currency', 'value', 'items'],
  view_item_list: ['currency', 'item_list_id', 'item_list_name', 'items'],
  view_promotion: [
    'creative_name',
    'creative_slot',
    'promotion_id',
    'promotion_name',
    'items'
  ]
};

/**
 * Item parameters whose documented type is `number`; every other item
 * parameter is a string.
 * @see https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */
export const GA4_NUMERIC_ITEM_PARAMETERS: readonly string[] = [
  'discount',
  'index',
  'price',
  'quantity'
];
