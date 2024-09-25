# Settings

## Project information

The project information section allows you to view and edit the project details. You can view the project name, description, and other details. You can also edit the project name and description as needed.

- Project Name: The name of the project.
- Description: A brief description of the project.
- Measurement ID: The Google Analytics Measurement ID associated with the project.
- Google Sheet Link: The Google Sheet link associated with the project.

## Authentication

The authentication is a username and password combination for the HTTP authentication if it's required to login before running tests.

## Google Tag Manager

There are several comoponents in the section that relates to Google Tag Manager.

- Request Interception

  This feature allows you to intercept the requests made by the GTM container. The requests are re-formatted to data layer alike format. The raw request is also available for inspection in the details page.

- GTM Accompanied Mode

  The GTM Accompanied Mode allows you to run the GTM preview mode along with the audit. This is useful when you want to see whether tags are fired in the GTM preview mode. It's also useful when you want to audit the published tags.

- GTM URL and Shareable Link

  The GTM URL is the workspace URL of the GTM container to be referenced and the shareable link is the link that can be shared with others to preview the specific GTM container setup.

## Browser arguments

It includes two parts:

- Browser arguments

  These are Puppeteer advanced arguments that you can pass to the browser to control the behavior of the application.

- Hide Browser

  The application allows you to hide the browser window while running the tests. This is useful when you want to run the tests in the background without the browser window being visible. It's always open with GTM Accompanied Mode enabled.

## Pre-load data

Preloading is loaded into the application before the tests are run. Specifically, localstorage and cookies are loaded into the browser. One of the common use cases is to load the consent cookie value to enable the data analytics being allowed to perform analytics data collection.

## Project IO

The feature allows you to import and export projects. You can import a project from a file or export a project to a file. The file format is a zip file.
