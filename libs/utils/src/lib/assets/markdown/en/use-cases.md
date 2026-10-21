# Use cases

Tracking problems often show up first in Google Analytics: page views drop, or an event's parameters read `(not set)`. They usually come from a site change that altered the `dataLayer`, or from a GTM change that broke a tag. TagCheck finds them by checking every planned event on the site itself.

TagCheck suits:

- sites with many tags, or with heavily customized GTM setups;
- teams that release the site or change GTM often;
- ecommerce sites, where events carry items and values that must stay exact.

## Check every event after a release

Import your GTM container to create one test per GA4 event tag, add a recording to each, and run them all after each release. The tests table shows which events stopped passing, and the Reports page keeps every run for comparison.

## Check a workspace before publishing

Accompanied Mode runs a test through GTM Preview, so the tags under test are those of your unpublished workspace. Watch the tags fire in Tag Assistant while TagCheck checks the data layer and the request.

## Check the parameters, not only the event

A spec states the parameters an event needs, with their values or patterns. For example, this spec requires an `add_to_cart` push whose single item is Switzerland or California, at the listed price and quantity:

```json
{
  "event": "add_to_cart",
  "ecommerce": {
    "currency": "USD",
    "value": 200,
    "items": [
      {
        "item_id": "$item_id",
        "item_name": "/^(?:Switzerland|California)$/",
        "item_category": "Europe",
        "quantity": 1,
        "price": 200
      }
    ]
  }
}
```

- `"$item_id"` only requires `item_id` to exist, whatever its value.
- `"/^(?:Switzerland|California)$/"` requires `item_name` to match the regular expression between the slashes.
- `"Europe"`, `1` and `200` must match exactly, type included: the number `200` does not match the string `"200"`.

**Quality assurance** lists every rule.

## Catch data that changes on the way to GA4

GTM Preview shows what the tags received, not what GA4 receives. A tag can drop a parameter, send the event to another measurement ID, or turn an array into a string. The data layer check still passes in those cases. The request check compares the GA4 request itself with the spec, so the test ends as Partial instead of hiding the gap, and the result keeps the raw request for review.
