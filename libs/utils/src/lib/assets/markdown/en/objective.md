# Objective

TagCheck aims to catch tracking problems before they reach your Google Analytics reports. It checks each planned GA4 event on the real site, the same way every time, so you can rerun the checks after every site release or GTM change.

## The data layer check

The site pushes data into `window.dataLayer`, and GTM reads it to fill its tags. The data layer check finds the push for the test's event and compares it with the spec, key by key. It fails when:

- the event is never pushed;
- a key in the spec is missing from the push;
- a value differs from the spec or does not match its pattern;
- an ecommerce event is not preceded by `{ ecommerce: null }`. Google asks for this push to clear the previous ecommerce data ([Measure ecommerce with Tag Manager](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce?client_type=gtm)).

## The request check

A correct push does not guarantee correct data in GA4. The tag may not fire, may send to another property, or may send parameters in a form GA4 does not collect. The request check looks at what actually leaves the browser: it intercepts the GA4 request for the event sent to the project's measurement ID, rebuilds its parameters into an object shaped like a `dataLayer` push, and compares that object with the same spec. It fails when no such request is sent or when its parameters do not match.

The request check needs a measurement ID in **Project Information** and **Activate Request Check** turned on in the **Google Tag Manager** settings. Without it, runs make only the data layer check: a run then shows its request check as **Not checked**, and its status follows the data layer check alone (Passed or Failed).

## Reading the status

- **Passed**: both checks passed.
- **Partial**: one check passed. The site may push the right data while the tag does not send it as planned, or the other way around.
- **Failed**: neither check passed. Start with the data layer: the event may never be pushed.
- **Not run**: the test has no run yet, or all its runs were deleted.

Hover over a status to see each check's result.
