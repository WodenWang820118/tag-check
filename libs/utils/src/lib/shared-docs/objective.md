# Objectives

The objective of this project is to let users create and manage their own Google Tag Manager (GTM) tag audit projects. The user can create a project, add tags to it, and then run an audit on the tags. The audit will check if the tags are used in the correct context and if they are used at all. The user can then review the audit results and make changes to the tags if necessary.

## Google Tag Manager

Google Tag Manager is a tag management system that allows users to manage and deploy tags on their websites without having to modify the code. Tags are snippets of code that are used to collect data from the website and send it to third-party services like Google Analytics, Facebook Pixel, etc.

## Audit

The audit will check if the tags are used in the correct context and if they are used at all. For example, if a tag is supposed to fire on a specific page, the audit will check if the tag is firing on that page. If a tag is not firing as expected, the report will mark it as failed and provide details on why it failed.

Failure reasons can include:

- The tag is not firing at all
- The tag is firing, but with incorrect/misplaced parameters

TagCheck enables you to audit the project with automation via unified specification.

# Unified Spec

## What's a Unified Spec?

Let's explore TagCheck and the unified spec - two valuable tools that streamline web development and marketing processes, particularly when working with Google Tag Manager (GTM).

## Understanding the Unified Spec

The unified spec can be thought of as a structured blueprint for your website's data collection strategy. It's written in JSON format, which is a standardized way to organize information that's readable by both humans and computers. Here's a simple example:

```json
{
  "event": "page_view",
  "page_location": "$page_location",
  "page_referrer": "$page_referrer"
}
```

This snippet outlines the specific information we aim to collect when a user views a page on our website.

## Key Features of the Unified Spec

The unified spec offers two primary benefits:

- Automated tag configuration in Google Tag Manager
- Efficient tag validation

## Automated Tag Setup

The unified spec simplifies the process of setting up tags in Google Tag Manager. It automatically configures:

Tag Event Name: `page_view`

| Event Parameter | Value                     |
| --------------- | ------------------------- |
| page_location   | `{{DLV - page_location}}` |
| page_referrer   | `{{DLV - page_referrer}}` |

| Trigger Name           | Trigger Type | Event name |
| ---------------------- | ------------ | ---------- |
| event equals page_view | Custom Event | page_view  |

The tag automates the tag, trigger, and variable creation process in GTM with custom event trigger.

## Tag Validation

TagCheck serves as a quality assurance tool for your tags. It verifies that:

- The tag has the correct name (e.g., page_view in this case)
- It's collecting the intended information. The event parameters are `page_location` and `page_referrer` in this case. TagCheck can further validate event parameter values such as string matching using regex or static values.
- The tag is functioning as expected when triggered
