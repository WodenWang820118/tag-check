# TagCheck
## Overview
This desktop application automates the GTM (Google Tag Manager) container review process and the production analytics deployment validation. It streamlines the quality assurance process by providing:

## Features
- The tool use a consistent JSON fomatted GTM specification and generate GTM compatible JSON file to be uploaded.
- The tool run the Chrome recorder JSON formatted file, and generate a report on dataLayer and captured requests correctness.
- Users can review the tag configuration through the GTM preview mode as well by using the sharable link.
- It validates analytics on the production website, ensuring dataLayer and request accuracy.
- It records the testing process as `webm` video and provide the screenshot as validation proof.
- It provides the downloadable files to be delivered.
- It can export and import projects; allow projects to be shared to others.

The product is designed for QA, development, and analytics teams by leveraging Angular, NestJS, and Electron.

## Alpha Version Notice

We are currently developing an alpha version in the `develop` branch, which includes new features and improvements. This version is intended for testing and feedback purposes.

- **Access the Alpha Version:** [Develop Branch](https://github.com/WodenWang820118/datalayer-checker/tree/develop)
- **Latest Alpha Release:** [Alpha Release Tag](https://github.com/WodenWang820118/tag-check/releases/tag/v3.0.0-alpha)

### Disclaimer
The alpha version is in active development and may contain bugs. It is not recommended for production use. Please test it before production usage and file issues if any.
