# Quality assurance

A test passes when the site and GTM send what its spec describes. This page explains how to write specs, how the two checks compare them, and how to review a tag before you publish it.

## Writing a spec

A spec is the `dataLayer` push you expect, written as JSON. Its `event` names the GA4 event, and every other key is a parameter the push must contain. Keys the spec does not list are ignored, so a spec only needs the parameters you care about.

Values follow these rules:

| Spec value                                    | Passes when                                                               |
| --------------------------------------------- | ------------------------------------------------------------------------- |
| `"$name"`, such as `"$item_id"`               | the key exists, whatever its value                                        |
| `"{{Variable Name}}"`, a Tag Manager variable | the key exists, whatever its value                                        |
| `"/pattern/"`                                 | the value is a string matching the regular expression between the slashes |
| any other string, number or boolean           | the value is exactly equal, type included                                 |
| an object, such as `ecommerce`                | each of its keys passes, by the same rules                                |
| an array, such as `items`                     | each entry matches at least one entry of the actual array, in any order   |

For example:

```json
{
  "event": "add_to_cart",
  "ecommerce": {
    "currency": "USD",
    "value": "$value",
    "items": [
      {
        "item_id": "$item_id",
        "item_name": "/^(?:Switzerland|California)$/",
        "quantity": 1
      }
    ]
  }
}
```

The number `1` does not match the string `"1"`. Write numbers as numbers when the site pushes numbers.

Tests imported from a GTM container start with a spec built from the tag: each parameter that reads a Data Layer Variable becomes a key holding the variable reference, such as `"value": "{{DLV - ecommerce.value}}"`, so the key must exist. Replace references with values or patterns where you want stricter checks. To edit a spec, open the test, go to **Latest result**, and use the edit button of the **Data Layer Spec** panel.

## Ecommerce events

For Google's recommended ecommerce events, and for any spec with `ecommerce.items`, the data layer check also requires a `{ ecommerce: null }` push before the event, as Google recommends to clear the previous ecommerce data ([Measure ecommerce with Tag Manager](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm)). The request check skips this rule, since the reset never leaves the browser.

A test can also have an **Item Definition**: one GA4 item, such as:

```json
{
  "item_id": "city001",
  "item_name": "Switzerland",
  "item_category": "Switzerland",
  "quantity": 1,
  "price": 799
}
```

For an ecommerce event, a run then expects this item as the entry of `ecommerce.items`, in place of the items in the spec. Edit it in the **Item Definition** panel of the test's **Latest result**.

## The request check

With **Activate Request Check** on, TagCheck intercepts the GA4 request for the test's event sent to the project's measurement ID. It reads the event name, event parameters and items from the request and rebuilds them into an object shaped like a `dataLayer` push, then applies the same spec. Google does not document the request format; TagCheck reads it as gtag.js sends it.

The rebuilt object keeps the types the request carries: numeric event parameters (`epn.`) and numeric item fields, such as `price` and `quantity`, become numbers; other event parameters (`ep.`) stay strings. If a tag sends a number as a text parameter, a spec value of `200` passes the data layer check but fails the request check on `"200"`. Fix the tag, or use `"$value"` or a pattern where the type does not matter.

## Reviewing a tag

The **Tag Snapshot** tab of a test shows the GA4 event tag the test came from:

- **Measurement ID**: the ID the tag sends to. When the tag references a Constant variable, such as `{{CONST - Measurement ID}}`, the tab shows the Constant's value and the reference under it.
- **Event Name** and **Event Parameters**: the parameters the tag sends, including those from its Event Settings variable. A value that reads a Data Layer Variable shows the data layer key it reads, such as `Data layer: ecommerce.value`.
- **Triggering**: the tag's trigger.

Compare it with the spec to see whether the tag reads the keys the site pushes.

## Accompanied Mode

Accompanied Mode runs a test through GTM Preview, so the tags under test are those of the workspace you preview, even unpublished. To use it, enter the **Preview Mode URL** in the **Google Tag Manager** settings and turn on **Activate Accompanied Mode**. The run opens Tag Assistant next to the site, and the browser window stays open afterwards for inspection; close it when you are done.
