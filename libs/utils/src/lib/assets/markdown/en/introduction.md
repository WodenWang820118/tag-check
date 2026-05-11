# Introduction

Here you can find information about the application and how to use it.

## Getting Started

The section will guide you through the basic steps to get started with the application. You will learn how the application helps you manage your Google Tag Manager (GTM) tag audit projects.

## Projects

The sections will guide you through the basic steps to create and manage projects in the application. You will learn how to create a new project, add tags to it, and run an audit on the tags. It will also guide you on other project management features like editing and deleting projects.

## Settings

The section will guide you through the basic steps to configure the application settings as needed. It includes:

- Project Information
- Authentication
- Pre-load Data
- Browser Settings
- Google Tag Manager and request interception settings
- Project IO

# How TagCheck works

This is a brief overview of how the application works.

## Puppeteer

Puppeteer is a Node library which provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol. It allows the application to run the audit with the browser automation. It also allows the application to manipulate multiple browser instances to fulfill the quality assurance requirements.

## Chrome Recorder

The Chrome Recorder is a tool that records user interactions with the browser and generates Puppeteer scripts. It allows the application to record the user interactions and replay them in the audit process. For flexibility, the application uses the JSON format from the recorder and use Puppeteer to run the audit.

## Audit Pipeline

When users run an audit, the application will create a new browser instance and replay the recorded interactions. The application will then check if the tags are firing correctly and provide a report on the audit results. The report will include details on the tags that are not firing correctly and the reasons why they failed.
