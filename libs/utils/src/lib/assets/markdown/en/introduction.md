# Introduction

Here you can find information about the application and how to use it.

## Getting Started

This section will guide you through the basic steps to get started with the application. You will learn how the application helps you manage your Google Tag Manager (GTM) tag audit projects.

## Projects

This section will guide you through the basic steps to create and manage projects in the application. You will learn how to create a new project, add tags to it, and run an audit on the tags. It will also guide you through other project management features like editing and deleting projects.

## Settings

This section will guide you through the basic steps to configure the application settings as needed. It includes:

- Project Information
- Authentication
- Pre-load Data
- Browser Arguments
- Google Tag Manager and request interception settings
- Project IO

## How TagCheck works

This is a brief overview of how the application works.

## Puppeteer

Puppeteer is a Node.js library that provides a high-level API to control headless Chrome or Chromium over the DevTools Protocol. It allows the application to run the audit using browser automation. It also allows the application to control multiple browser instances to fulfill the quality assurance requirements.

## Chrome Recorder

The Chrome Recorder is a tool that records user interactions with the browser and generates Puppeteer scripts. For flexibility, the application uses the JSON format from the recorder and Puppeteer to run the audit.

## Audit Pipeline

When you run an audit, TagCheck creates a new browser instance and replays the recorded interactions. TagCheck then checks if the tags are firing correctly and provides a report on the audit results. The report includes details on the tags that are not firing correctly and the reasons why they failed.
