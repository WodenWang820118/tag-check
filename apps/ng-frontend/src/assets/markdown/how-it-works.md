# How it works

This is a brief overview of how the application works.

## Puppeteer

Puppeteer is a Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol. It allows the application to run the audit with the browser automation. It also allows the application to manipulate multiple browser instances to fulfill the quality assurance requirements.

## Chrome Recorder

The Chrome Recorder is a tool that records user interactions with the browser and generates Puppeteer scripts. It allows the application to record the user interactions and replay them in the audit process. For flexibility, the application uses the JSON format from the recorder and use Puppeteer to run the audit.

## Audit Pipeline

When users run an audit, the application will create a new browser instance and replay the recorded interactions. The application will then check if the tags are firing correctly and provide a report on the audit results. The report will include details on the tags that are not firing correctly and the reasons why they failed.
