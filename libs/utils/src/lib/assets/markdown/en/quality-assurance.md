# Quality assurance

Quality assurance is the process of confirming whether the acceptance criteria are met. This document guides you through the platform's QA flow step by step.

## Report creation

Before auditing a test case, add a report entry for reference. Since the same event can be triggered in multiple places, the system creates an event ID for each report. When there are multiple `add_to_cart` test cases, one shared JSON specification covers all of them. For example:

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

You can edit the spec afterward as needed. The event name is unique, so the system will not let you add another `add_to_cart` spec. Instead, other test cases reference the shared spec by event name, for example:

```json
{
  "event": "add_to_cart"
}
```

## Specification review

Measurement specifications should stay consistent for the same event. Consistent specs make Google Analytics reports easier to understand and help avoid confusing `(not set)` values. Because specs are shared globally, editing one may affect other test cases.

## Chrome recording

Chrome Recorder captures CSS or ID selectors, XPath expressions, and other information needed to replay the flow. Common actions include clicking, hovering, typing, and selecting. After downloading the JSON recording from the browser, upload it to the system and TagCheck will use it during the audit. Currently, TagCheck runs the flow with CSS and ID selectors.

## Google Tag Manager

Google Tag Manager is a tag management system that helps teams focus on tracking without directly editing the website codebase. TagCheck aims to reduce repetitive manual testing and support higher-quality QA against business requirements.

## Data layer

The data layer is a JavaScript object that bridges user interactions and the data collection pipeline. For example, when you click a button, the data layer receives the defined data and triggers the corresponding GTM tag. Inspecting the data layer is therefore one of the core ways to verify implementation quality.

## Request interception

In most cases, checking the data layer is enough. There are still situations where an implementation appears correct in GTM Preview, but Google Analytics receives a transformed value instead. One example is array data being turned into strings. To reduce false positives, TagCheck can also audit outgoing requests. TagCheck intercepts requests using the measurement ID configured in the project, rebuilds them into a data-layer-like object, and reuses the same validation logic against the spec.

## GTM accompanied mode

GTM Accompanied Mode lets you inspect tag firing alongside GTM Preview while automation is running. It is also useful when you want to audit an unpublished workspace. Provide the GTM container's shareable link and landing page URL so TagCheck can open the preview session and run the audit.
