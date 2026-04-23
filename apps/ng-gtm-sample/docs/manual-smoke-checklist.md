# ng-gtm-sample Manual Smoke Checklist

## Home Flow
- Open `/home` and confirm the Tailwind/PrimeNG shell renders without layout collapse.
- Confirm the featured carousel advances and the CTA routes into the destination catalog.
- Open cookie settings and verify the modal toggles and save controls still respond.
- If GTM preview or a `dataLayer` inspector is available, confirm page-view level events still appear after the home shell loads.

## Product Flow
- Open `/product/destinations` and confirm the list renders with images.
- Search for `all` and confirm the full catalog appears.
- Open a destination detail page and verify gallery images, price, and add-to-cart flow still work.
- Add one destination to the basket and verify the expected ecommerce event payload is pushed for `view_item`, `view_item_list`, and `add_to_cart`.

## Transaction Flow
- Add a destination to the basket and confirm the basket summary updates.
- Continue to checkout and confirm shipping and payment sections can be completed.
- Place an order and confirm the thank-you page renders without duplicate runtime errors.
- Verify `begin_checkout` and `purchase` each fire once with the expected order payload after completing the checkout flow.

## Admin Flow
- Sign in with the Google login flow before opening `/admin/dashboard`, then confirm the authenticated shell is stable after a refresh.
- Open `/admin/dashboard` and confirm KPI cards plus the map load.
- Open `/admin/add-data` and confirm validation blocks incomplete submissions.
- Submit a complete destination with four images and confirm success messaging appears.
- Return to `/admin/dashboard` and `/product/destinations?search_term=all` to confirm the new destination appears without manually clearing cache.
