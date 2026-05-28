# Getting started

TagCheck helps you define a unified specification and apply it to both GTM and production site tag validations.

## What is Google Tag Manager

Google Tag Manager is a tool for managing and deploying marketing tags (snippets of code or tracking pixels) on your website (or mobile app) without having to modify the code. It allows you to add and update tags without having to involve a developer. Tags are used to collect data from your website and send it to third-party services like Google Analytics, Facebook Pixel, etc.

## What is TagCheck

TagCheck is a tool that helps you manage your Google Tag Manager (GTM) tag audit projects. You can create a project, add tags to it, and run an audit on the tags. The audit will check if the tags are used in the correct context and if they are used at all. You can then review the audit results and make changes to the tags if necessary.

## Create a project and the first test case

Each project is identified by a unique project slug. Fill in the form to configure the project for use with Google Tag Manager. Before running automation, there are two essential requirements: spec and recording.

## Spec

The spec is where the specification is defined in JSON format. For example,

```json
{
  "event": "page_view",
  "page_location": "$page_location",
  "page_referrer": "$page_referrer"
}
```

TagCheck can check key values based on several scenarios:

- Dollar-headed string: only verify whether the key exists
- Static value: string or number. Please note GA4 doesn't accept array objects other than in the recommended events that use the `items` parameter, such as `add_to_cart`
- Regular expression: customized via a regex pattern such as `^(?:switzerland|california)$`

## GTM tag configuration

The created tag can be configured with `TagBuild`, which converts your specs to GTM-compatible JSON format. After conversion, you can either paste the JSON into GTM or download it as a JSON file.

## Recording

The recording is a JSON-formatted file from Chrome Recorder. Currently, TagCheck supports CSS and ID selectors. For example,

```json
{
  "title": "add_to_cart",
  "steps": [
    {
      "type": "setViewport",
      "width": 1737,
      "height": 1100,
      "deviceScaleFactor": 1,
      "isMobile": false,
      "hasTouch": false,
      "isLandscape": false
    },
    {
      "type": "navigate",
      "url": "https://ng-gtm-sample.vercel.app/home"
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["div.active img"]],
      "offsetY": 44.42852783203125,
      "offsetX": 344.60711669921875
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["app-details button"]],
      "offsetY": 22.705322265625,
      "offsetX": 67.1070556640625
    }
  ]
}
```

Please download it as a JSON file and upload it to TagCheck or paste the content into the text editor.

## Running a test

A play button is located in the top right corner of the table. Clicking it will run the test based on your recording and tag configuration. The progress will be synced and displayed while the test is running. Progress depends on the number of actions required. For instance:

```json
{
  "title": "add_to_cart",
  "steps": [
    {
      "type": "setViewport",
      "width": 1737,
      "height": 1100,
      "deviceScaleFactor": 1,
      "isMobile": false,
      "hasTouch": false,
      "isLandscape": false
    },
    {
      "type": "navigate",
      "url": "https://ng-gtm-sample.vercel.app/home"
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["div.active img"]],
      "offsetY": 44.42852783203125,
      "offsetX": 344.60711669921875
    },
    {
      "type": "click",
      "target": "main",
      "selectors": [["app-details button"]],
      "offsetY": 22.705322265625,
      "offsetX": 67.1070556640625
    }
  ]
}
```

## Test result

After test completion, the results will be displayed in two sections: Data Layer and Request.

## Data layer

The data layer is an object under the browser's window object. Google Tag Manager utilizes and monitors the data layer to send data to Google Analytics 4. In the browser console, you can use `window.dataLayer` to verify whether the target site pushes the agreed data in the data layer with the defined steps.

## Request

With `Check Request` enabled and measurement ID filled, TagCheck will intercept the request based on the measurement ID and event name. Further, TagCheck decomposes the request URL and recomposes relevant information into the data layer object. For example,

'https://www.google-analytics.com/g/collect?v=2&tid=G-8HKQR5ZBSK<br />&gtm=45je4410v9171567282z89168785492za200&\_p=1712224628461&gcs=G111&gcd=13r3r3r3q7&npa=1&dma=0&cid=485839296.1712224634<br />&ul=en-us&sr=2195x1235&uaa=x86&uab=64&uafvl=Chromium%3B121.0.6167.85%7CNot%2520A(Brand%3B99.0.0.0&uamb=0&uam=<br />&uap=Windows&uapv=15.0.0&uaw=0&pscdl=noapi&\_s=5&dr=&dl=&cu=USD&sid=1712224634&sct=1&seg=1&dt=Ng%20GTM%20Integration%20App<br />&en=add_to_cart&pr1=idcity001~ nmSwitzerland ~ lndestinations ~ caSwitzerland ~ qt1 ~ pr799&epn.value=799<br />&ep.promotion_id=city001&ep.promotion_name=Switzerland&ep.creative_name=travel_slide&ep.creative_slot=featured_attributor&\_et=8682&tfd=30981'

Will be converted to:

```json
{
  "event": "add_to_cart",
  "creative_name": "travel_slide",
  "creative_slot": "featured_attributor",
  "promotion_id": "city001",
  "promotion_name": "Switzerland",
  "ecommerce": {
    "value": "799",
    "currency": "USD",
    "items": [
      {
        "item_id": "city001",
        "item_name": "Switzerland",
        "item_category": "Switzerland",
        "price": "799",
        "quantity": "1"
      }
    ]
  }
}
```

The classic example would be `add_to_wishlist`, which is one of the recommended GA4 events. However, there is no `remove_from_wishlist` equivalent—so although `items` appears in the GTM preview, it doesn't get sent to Google Analytics 4. Checking requests confirms what data is actually transmitted.

## Report

Reports are automatically generated after running each test. The report includes:

- Data layer specification: the defined specification given when creating the test case
- Actual data layer: the data layer under the browser's window object
- Request data layer: the recomposed data layer from the network request
- Raw request: if captured, it can be used to verify whether the data is sent to GA4
- Destination URL: the link where the event is being triggered
- Screenshot: the image where the event is being triggered

All reports are available to download via the Reports sidebar menu.
