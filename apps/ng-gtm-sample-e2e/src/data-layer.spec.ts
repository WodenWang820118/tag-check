import { test, expect, type Page } from '@playwright/test';
import {
  GA4_ECOMMERCE_EVENT_PARAMETERS,
  GA4_NUMERIC_ITEM_PARAMETERS
} from '@utils';

type DataLayerEntry = Record<string, unknown> | null;

/**
 * Checks the data layer contract tag-check validates against: the pushes the
 * site makes and the GA4 tags in its container read. Nothing leaves the
 * machine: Tag Manager and every other third-party request is blocked.
 */
test.beforeEach(async ({ page, baseURL }) => {
  const origin = new URL(baseURL ?? 'http://localhost:4202').origin;
  await page.route(
    (url) => url.origin !== origin,
    (route) => route.abort()
  );
  // Same consent the tag-check example project seeds before each run.
  await page.addInitScript(() => {
    localStorage.setItem('consent', 'true');
    localStorage.setItem(
      'consentPreferences',
      '{"ad_storage":true,"analytics_storage":true,"ad_user_data":true,"ad_personalization":false}'
    );
  });
  // The viewport the example project's recordings were made with.
  await page.setViewportSize({ width: 1404, height: 945 });
});

test('the home page pushes page_view with the page parameters its GA4 tag reads', async ({
  page
}) => {
  await page.goto('/home');

  const pageView = await waitForPush(page, 'page_view');
  for (const key of ['page_path', 'page_title', 'page_location']) {
    expect(typeof pageView[key], `page_view.${key}`).toBe('string');
  }
  expect(String(pageView['page_location'])).toContain('/home');
});

test('the home carousel pushes view_promotion as a recommended ecommerce event', async ({
  page
}) => {
  await page.goto('/home');

  const viewPromotion = await expectRecommendedEcommercePush(
    page,
    'view_promotion'
  );
  const ecommerce = viewPromotion['ecommerce'] as Record<string, unknown>;
  for (const key of ['creative_name', 'creative_slot', 'promotion_id']) {
    expect(typeof ecommerce[key], `ecommerce.${key}`).toBe('string');
  }
});

// Uses the data-testid hooks the example project's recordings click. Picking the
// slide with its dot first stops autoplay, so the explore button stays put.
test('adding a destination to the cart pushes the item the example project expects', async ({
  page
}) => {
  await page.goto('/home');
  await page.getByTestId('promotion-dot-city001').click();
  await page.getByTestId('promotion-explore-city001').click();
  await expectRecommendedEcommercePush(page, 'view_item');
  await page.getByTestId('add-to-cart').click();

  const addToCart = await expectRecommendedEcommercePush(page, 'add_to_cart');
  expect(addToCart['ecommerce']).toMatchObject({
    currency: 'USD',
    value: 799,
    items: [
      {
        item_id: 'city001',
        item_name: 'Switzerland',
        item_list_name: 'destinations',
        item_category: 'Switzerland',
        quantity: 1,
        price: 799
      }
    ]
  });
});

async function readDataLayer(page: Page): Promise<DataLayerEntry[]> {
  return page.evaluate(() =>
    JSON.parse(
      JSON.stringify(
        (globalThis as unknown as { dataLayer?: unknown[] }).dataLayer ?? []
      )
    )
  );
}

async function waitForPush(
  page: Page,
  eventName: string
): Promise<Record<string, unknown>> {
  await expect
    .poll(async () =>
      (await readDataLayer(page)).some(
        (entry) => entry?.['event'] === eventName
      )
    )
    .toBe(true);
  const dataLayer = await readDataLayer(page);
  return dataLayer.findLast(
    (entry) => entry?.['event'] === eventName
  ) as Record<string, unknown>;
}

/**
 * Rules from Google's docs for recommended ecommerce events in Tag Manager:
 * clear the previous ecommerce object with `{ ecommerce: null }` before the push,
 * send one of item_id or item_name per item, send `currency` with `value`,
 * and send value, price, quantity, discount and index as numbers.
 * https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm
 * https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm
 */
async function expectRecommendedEcommercePush(
  page: Page,
  eventName: string
): Promise<Record<string, unknown>> {
  expect(Object.keys(GA4_ECOMMERCE_EVENT_PARAMETERS)).toContain(eventName);
  await waitForPush(page, eventName);
  const dataLayer = await readDataLayer(page);
  const index = dataLayer.findLastIndex(
    (entry) => entry?.['event'] === eventName
  );
  expect(dataLayer[index - 1], `reset before ${eventName}`).toEqual({
    ecommerce: null
  });

  const push = dataLayer[index] as Record<string, unknown>;
  const ecommerce = push['ecommerce'] as Record<string, unknown>;
  const items = ecommerce['items'] as Record<string, unknown>[];
  expect(items.length, `${eventName} items`).toBeGreaterThan(0);
  for (const item of items) {
    expect(item['item_id'] ?? item['item_name']).toBeTruthy();
    for (const key of GA4_NUMERIC_ITEM_PARAMETERS) {
      if (key in item) {
        expect(typeof item[key], `item ${key}`).toBe('number');
      }
    }
  }
  if ('value' in ecommerce) {
    expect(typeof ecommerce['value'], `${eventName} value`).toBe('number');
    expect(typeof ecommerce['currency'], `${eventName} currency`).toBe(
      'string'
    );
  }
  return push;
}
