# Use Cases

Usually, anomalies can be found in a Google Analytics report. For example, the number of page views is significantly lower than usual, or a specific event has the `(not set)` event parameters. These anomalies could be caused by incorrect tag implementation within Google Tag Manager. By running an audit on the tags, you can identify the tags that are firing inaccurately and fix them.

TagCheck is suitable for:

- Large websites with many tags
- Websites with complex tag customizations on GTM
- Frequent changes on websites and GTM tags

## Automation with GTM

When enabled with the GTM shareable link, the audit will run in GTM Accompanied Mode. When the audit is running, the GTM preview mode will be opened in another browser instance. GTM Preview mode allows you to see the tags firing in real time.

## Validate tag firing

In this use case, you want to identify the tags that are not firing at all. The tags depend on the data layer, and failures can be due to trigger issues or incorrect tag implementation.

## Verify parameters

According to the specification, the audit can examine whether the tags are firing with the correct parameters. For example,

```json
{
  "event": "add_to_cart",
  "ecommerce": {
    "items": [
      {
        "item_id": "$item_id",
        "item_name": "^(?:switzerland|california)$",
        "item_category": "Europe",
        "quantity": 1,
        "price": 200
      }
    ],
    "currency": "USD",
    "value": 200
  }
}
```

- The `item_id` should exist and the audit won't check the value. The `$item_id` is a placeholder for the actual value and it could be convenient for you to reference it when planning the tags. For example, you can use `$item_id` as another custom event parameter for another tag. Moreover, you may combine `$item_id` and other parameters such as `$index` for further measurement indication. This is more relevant to the measurement planning artifact.
- The `item_name` should be either `switzerland` or `california` with a regex pattern
- The `item_category` should be an exact word `Europe`
- The `quantity` should be exactly `1` and it should be an integer

## Identify false positive request

In the GTM (Google Tag Manager) container, tags can be implemented incorrectly. For example, a tag may fire a custom event whose parameters include an array—a format not supported by Google Analytics. The audit intercepts the request and reformats the information into a data-layer-like structure, then checks whether the tag is firing with the correct parameters. For example,

```typescript
{
  event: 'remove_from_wishlist',
  ecommerce: {
    items: [
      {
        item_id: '$item_id',
        item_name: '^(?:switzerland|california)$',
        item_category: 'Europe',
        quantity: 1,
        price: 200
      }
    ],
    currency: 'USD',
    value: 200
  }
}
```

The `remove_from_wishlist` event's item array won't be collected by Google Analytics since it's not listed as one of the recommended events, although the information appears in GTM Preview. The audit will mark the tag as failed and provide details on why it failed.
