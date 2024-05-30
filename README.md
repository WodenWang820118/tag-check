# Table of Contents

[Overview](#overview)

[Development](#development)

- [Frontend (Angular)](#frontend-angular)
- [Backend (Nest.js)](#backend-nestjs)

[Build and Production](#build-and-production)

- [Frontend (Angular)](#frontend-angular-1)
- [Backend (Nest.js)](#backend-nestjs-1)
- [Build](#build)
- [Package](#package)

[Feedback and Contribution](#feedback-and-contribution)

# Overview

This desktop application automates the GTM (Google Tag Manager) container review process and the production analytics deployment validation. It streamlines the quality assurance process by providing:

1. **GTM Container Review**: The tool can load the GTM preview mode according to the workspace, run the Chrome recorder, and generate a report on dataLayer correctness. Users can review the tag configuration through the GTM preview mode as well.
2. **Production Analytics Validation**: It validates analytics on the production website, ensuring dataLayer accuracy.

Designed for QA, development, and analytics teams, this free standalone tool leverages Angular 17, Nest.js, and Electron.

Upcoming features include enhanced UI/UX, request interception, report consolidation, and improved project import/export capabilities.

# Development

Please run

```bash
npm install

```

## Frontend (Angular)

For development

```bash
npm run dev-front
```

## Backend (Nest.js)

Use the following command for backend development with a development server:

```bash
npm run dev-back
```

You may need to remove the `.db/data.sqlite3` to re-init the cached data.

## Electron

Use the following command for Electron development with a development server:

```bash
npm run dev-electron
```

Use the following command for Electron development with a staging server:

```bash
npm run staging-electron
```

# Build and Production

## Frontend (Angular)

For production usage

```bash
npm run prod-front
```

## Backend (Nest.js)

For production usage

```bash
npm run prod-back
```

## Build

Compile the application with:

```bash
npm run build
```

Which will build the Angular app with the production backend.

The output folder will be by default `dist/apps`. There will be two apps:

- `ng-frontend`
- `nest-backend`

Please refer to `package.json` for more scripts.

## Package

Please run the command to build the Electron app:

```bash
npm run package
```

The output will be in the `out` folder.

## Make

Please run the command:

```bash
npm run make
```

It will generate a Windows x32/x64 zip file.

# Feedback and Contribution

We welcome your feedback and contributions! If you have suggestions or encounter issues, please file them in the issues section. For those interested in contributing, check out the contribution guidelines (drafting).
