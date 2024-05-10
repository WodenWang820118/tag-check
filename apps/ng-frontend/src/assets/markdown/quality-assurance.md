# Quailty Assurance

The quality assurance is a process where testers state whether the acceptance criteria is meet. The document will guide you through the quality assurance process on the platform step by step.

## Report Creation

Before auditing a test case, adding a report test case to be referenced. Since it's possible to trigger an event in multiple places, the system will create an event id for each report. Say, if you're having two `add_to_cart` events. The first test case will need you specify the specification in the JSON format. For example:

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

You can edit the spec afterward as needed.
Please note the event is unique and the system won't allow you to add another `add_to_cart` spec, but will reference the event name and share the spec across different test cases. For example,

```typescript
{
  event: 'add_to_cart',
};
```

You'll need to provide the event for referencing the shared spec.

## Specification Review

The measurement spec define your KPI (Key Performance Indicator) and it should be consistent in terms of an event. When planning the measurement, we would like consistent measurement spec so that in the Google Analytics report, it'll show informative information without confusing `(not set)` values. Sometimes, we'll add or remove the parameters, so under each test case report, the spec is edittable. Please note the spec is shared, so modifying it might cause other test cases to fail.

## Chrome Recording

Using chrome recorder is getting easy as the article is written. The recorder records the CSS/ID selectors, xPath, and others to indicate where the operation should be performed. Most of the scenarios would be clicking, hovering, changing (includes typing and selection). After downloading the JSON format recording files from the browser, we can upload the recording file to the system. The system will use the file in the audit process. The system will mainly use the CSS/ID selectors to perform the operation.

## Google Tag Manager (GTM)

Google Tag Manager is a data collection tool allows users to focus on the data tracking without modifying the website's codebase. The application aims providing an automatic way to reduce the repeated manual testing and hope it helps testers provide high-quality assurance against the business requirements.

## Data Layer

The data layer is a JavaScript object briding the user interactions and the data collection pipeline. For instance, an user clicks on a button and the data layer will receive the data defined and trigger the GTM's tag accordingly. As a result, examing data layer is one of the core features to ensure the implementations are correct.

## Request Interception

Most of the cases, checking the data layer implementation would be sufficient. As the time the article is written, there's only one exception that implementations may to send the array object back to Google Analytics, but the data will be transformed as strings (text) instead.

The misunderstanding occurs when utilizing the GTM's preview mode that the array object is showing correctly when examing the tag, but it is not as expected when reading the report in Google Analytics. Furthermore, the BigQuery, the Google's data warehouse also recognize the array as string.

Therefore, it's recommended to audit the request as well when we're not sure whether event conforms or behave as expected. The application intercepts the request with the measurement ID provided in the project information as there could be multiple measurement IDs are used on a website. The system will re-form the request string to be data layer alike object and reuse the examination logic aginst the spec.

Please note sometimes the interactions will be reckoned as bot and it won't trigger the request as expected. Therefore, heading to the GTM accompanied mode for mitigating the issue.

## GTM Accompanied Mode

The GTM accompanied mode allows users to inspect whether tags are firing with GTM preview mode. It also provides a way to examine the unpublished workspace with automation. You'll need to provide the shareable link of the GTM container to the system. The system will open the GTM preview mode and run the audit.
