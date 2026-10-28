# Measurement plan

A measurement plan defines the events and parameters your website needs to collect. In TagCheck, a measurement plan is the shared contract between digital marketing and engineering: Tag Build turns it into a Google Tag Manager (GTM) container, developers implement the matching `dataLayer.push` calls, and TagCheck audits whether the site pushes the required data.

## Where events come from

When planning event tracking, decide whether each user action corresponds to one of Google's recommended events or requires a custom event.

### Recommended events vs custom events

- **[Google's recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events?client_type=gtm)**: Google defines standardized events and parameter names for specific business verticals (such as online sales, lead generation, and games). Using recommended names (such as `purchase`, `add_to_cart`, `sign_up`, and `generate_lead`) automatically enables built-in dimensions, metrics, and ecommerce funnel reports in GA4.
- **Custom events**: If an interaction does not fit Google's recommended list (for example, opening an interactive calculator or selecting a customized filter), define a custom event name. Custom events require you to register custom dimensions or metrics in GA4 to view their parameter values in standard reports.

### Event and parameter naming rules

Google Analytics 4 enforces strict [naming rules](https://support.google.com/analytics/answer/13316687) on event and parameter names:

- **Characters**: Event and parameter names must start with a letter and contain only letters, numbers, and underscores (`_`). Spaces, dashes, and periods are not permitted.
- **Length**: Event names and parameter names are limited to 40 characters maximum.
- **Case sensitivity**: Event names are case sensitive (`Purchase` and `purchase` are treated as distinct events; prefer lowercase names like `purchase`).
- **Reserved prefixes and words**: Parameter names must not start with `firebase_`, `ga_`, or `google_`. The parameter name `event` is reserved by the data layer and cannot be used as an event parameter.

## From plan row to TagCheck validation

Every row in your measurement plan travels through a unified five-stage lifecycle. Here is a worked example using the `purchase` event:

1. **One plan row**: In the plan CSV, you define the event and its expected parameters:
   - `event_name`: `purchase`
   - `event_parameters`: `transaction_id=/^T\d+$/, currency=TWD, value`
   - `item_parameters`: `item_id, item_name, price`
2. **The `dataLayer.push` the site sends**: The website's developers push the event and ecommerce payload to `window.dataLayer`. Ecommerce events clear the previous `ecommerce` object first:
   ```javascript
   window.dataLayer = window.dataLayer || [];
   window.dataLayer.push({ ecommerce: null }); // clear the previous ecommerce object
   window.dataLayer.push({
     event: 'purchase',
     ecommerce: {
       transaction_id: 'T12345',
       currency: 'TWD',
       value: 1200,
       items: [{ item_id: 'SKU_123', item_name: 'Example', price: 1200 }]
     }
   });
   ```
3. **The GTM tag Tag Build generates**: Tag Build converts the plan into a GA4 Event Tag triggered by the custom event `purchase`. For ecommerce events, the tag automatically reads data from the `ecommerce` data layer object.
4. **What GA4 receives**: When the tag fires in the browser, GTM sends an HTTP `/g/collect` request to Google Analytics containing the measurement ID (`&tid=...`), event name (`&en=purchase`), event parameters (`&ep.currency=TWD`), and item parameters.
5. **What TagCheck checks**: Replaying the user flow in Puppeteer, TagCheck performs two checks:
   - **Data layer check**: Compares the captured `dataLayer.push` payload against the plan spec, confirming that `transaction_id` matches the regex `/^T\d+$/`, `currency` equals `'TWD'`, `value` is present, and `items` contains the required properties.
   - **Request check**: Intercepts the outgoing network request to GA4 to verify that the `/g/collect` call reached the designated measurement ID with the expected event payload.

## Rule syntax

Each parameter in the measurement plan can define a validation rule. TagCheck evaluates these rules during replay:

| Rule form              | Example                      | Plan syntax                                      | What TagCheck accepts                                                                                                                                                |
| :--------------------- | :--------------------------- | :----------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Any value**          | `currency` or `value`        | Parameter name only (spec: `"$currency"`)        | TagCheck requires the key to exist in the data layer push; any value (string, number, or boolean) passes.                                                            |
| **Specific value**     | `currency=TWD` or `value=10` | Parameter name followed by `=<value>`            | TagCheck requires the pushed value to strictly equal (`===`) the expected value. `value=10` requires a number, `in_stock=true` a boolean, and `level="10"` a string. |
| **Regular expression** | `transaction_id=/^T\d+$/`    | Parameter name followed by `=/<pattern>/[flags]` | TagCheck requires the pushed value to be a string that matches the regular expression pattern. Flags such as `i` are supported, and patterns may contain commas.     |

When validating arrays such as `ecommerce.items`, TagCheck requires every entry defined in the spec to match at least one actual entry in the captured array, in any order.

## Getting the plan to developers: "For developers" snippets

To streamline handoff to web developers, Tag Build provides the **For developers** button:

1. Enter or upload your plan specs in Tag Build.
2. Click **For developers** to open the developer snippets dialog.
3. Tag Build builds complete, copyable JavaScript code for each event:
   - Cites Google's official documentation anchor for recommended events.
   - Includes `{ ecommerce: null }` clearing for ecommerce events.
   - Populates realistic placeholder values based on parameter names (`USD` for currency, `0` for numeric values, `SKU_123` for item IDs, `T12345` for transaction IDs).
   - Annotates each parameter with inline comments explaining its validation rule (`// must match /^T\d+$/`, `// must be "TWD"`, `// any value`).
4. Click **Copy all** or **Download (.js)** to save all snippets as a JavaScript file for the engineering team.

## The flow in TagCheck

TagCheck integrates Tag Build directly into your testing workflow:

- **Import into this project**: On TagCheck's TagBuild page, once your plan passes conversion checks, click **Import into this project**. TagCheck imports the generated GTM tags, triggers, and variables directly into your current project's configuration.
- **Use this project's container**: In the **Tag Extract** tab, TagCheck can read your project's saved container and extract the active GA4 tags back into a measurement plan CSV. You can download the extracted plan, adjust event rules, and re-upload it to refine your tracking specs.
