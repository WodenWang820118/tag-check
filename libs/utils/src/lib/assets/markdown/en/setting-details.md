# Settings

## Project information

The project information section lets you review and edit project details such as the project name, description, measurement ID, and linked Google Sheet.

- Project Name: the name of the project.
- Description: a short description of the project.
- Measurement ID: the Google Analytics measurement ID associated with the project.
- Google Sheet Link: the Google Sheet linked to the project.

## Authentication

Authentication is a username and password combination used for HTTP authentication when sign-in is required before running tests.

## Google Tag Manager

This section contains several GTM-related settings.

- Request Interception

  This feature intercepts requests made by the GTM container, reformats them into a data-layer-like structure, and keeps the raw request available on the detail page.

- GTM Accompanied Mode

  This mode runs GTM Preview alongside the audit so you can confirm whether tags fire as expected. It is also useful when auditing published tags.

- GTM URL and Shareable Link

  The GTM URL points to the workspace to inspect, while the shareable link is the preview link you can share with others for the same GTM container setup.

## Browser arguments

This section includes two parts:

- Browser arguments

  Advanced Puppeteer arguments that control browser behavior.

- Hide Browser

  Lets you hide the browser window while tests are running in the background. The browser stays visible when GTM Accompanied Mode is enabled.

## Pre-load data

Pre-load data is loaded into the application before tests run, especially local storage and cookies. A common use case is loading consent cookies so analytics collection is enabled before automation starts.

## Project IO

This feature lets you import and export projects. Projects are transferred as zip files.
