# Use Cases

Usually, anomalies could be found in Google Analytics report. For example, the number of page views is significantly lower than usual, or specific event has so called "not set" event parameters. These anomalies could be caused by incorrect tag implementation. By running an audit on the tags, the user can identify the tags that are not firing correctly and fix them.

It's suitable for:

- Large websites with many tags
- Websites with complex tag customizations on GTM
- Frequent changes on websites and GTM tags

## GTM Accompanied Mode Audit

When enabled with the GTM sharable link, the audit will run in the accompanied mode. When the audit is running, the GTM preview mode will be opened in another browser instance. It allows you to see the tags firing in real-time.

## Identify Tags That Are Not Firing

In this use case, the user wants to identify the tags that are not firing at all. The tags depends on the data layer, and it could be due to trigger issues or incorrect tag implementation.

## Identify Tags With Incorrect Parameters

According to the specification, the audit can examine whether the tags are firing with correct parameters. For example,

```typescript
{
  event: 'add_to_cart',
  ecommerce: {
    items: [
      {
        item_id: '$item_id',
        item_name: '^(?:switzerland|california)$',
        item_category: 'Europe',
        quantity: 1,
        price: 200,
      },
    ],
    currency: 'USD',
    value: 200,
  },
};
```

- The `item_id` should exist and the audit won't check the value
- The `item_name` should be either 'switzerland' or 'california' with regex pattern
- The `item_category` should be an exact word 'Europe'
- The `quantity` should be exactly 1 and it should be an integer

## Identify Request That Are Firing with Incorrect Implementation

In the GTM (Google Tag Manager) container, the tags could be implemented incorrectly. For example, the tag fires a custom event, which the event parameters as an array is not supported by Google Analytics. The audit intercepts the request and reformats the information to be data layer alike format. Then, it checks whether the tag is firing with correct parameters. For example,

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
        price: 200,
      },
    ],
    currency: 'USD',
    value: 200,
  },
};
```

The event `remove_from_wishlist`'s item array won't be collected by Google Analytics since it's not listed as one of the recommended events although the information shows in the GTM preview mode. The audit will mark the tag as failed and provide details on why it failed.
