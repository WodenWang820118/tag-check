# GTM Container Review and Analytics Validation Tool

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Development](#development)
  - [Prerequisites](#prerequisites)
  - [Frontend (Angular)](#frontend-angular)
  - [Backend (NestJS)](#backend-nestjs)
  - [Electron](#electron)
- [Build and Production](#build-and-production)
  - [Frontend](#frontend)
  - [Backend](#backend)
  - [Build](#build)
  - [Package](#package)
  - [Make](#make)
- [Feedback and Contribution](#feedback-and-contribution)

## Overview

This desktop application automates the Google Tag Manager (GTM) container review process and production analytics deployment validation. It streamlines the quality assurance process by providing:

1. **GTM Container Review**: Load GTM preview mode, run Chrome recorder, and generate dataLayer correctness reports. Users can review tag configurations through GTM preview mode.
2. **Production Analytics Validation**: Validate analytics on the production website, ensuring dataLayer accuracy.

Designed for QA, development, and analytics teams, this free standalone tool leverages Angular, NestJS, and Electron.

## Features

- **Unified JSON Format**: Generate GTM-compatible JSON files and run different recorded tests using a consistent specification.
- **Video Recording**: The entire process is recorded as a .webm video.
- **GTM Accompanied Mode**: Observe unpublished tags within GTM using a shareable link and the website's landing page.
- **Request Capture**: Efficiently capture and validate tags automatically. Captured requests are recomposed to data layer object for validation.
- **XLSX Report**: Test results are encapsulated in an XLSX report, including:
  - Data layer
  - Raw captured requests
  - Reconstructed data layer based on raw captured requests
  - Screenshots of event triggers
- **Project Transfer**: Archive projects as .zip files for import into other users' applications.

## Development

This project uses NodeJS v22.8.0 LTS for development.

### Prerequisites

Install dependencies:

```bash
npm install -g yarn
```

```bash
yarn
```

### Frontend (Angular)

For development:

```bash
yarn run dev-front
```

### Backend (NestJS)

For development:

```bash
yarn run dev-back
```

### Electron

For Electron development with a development server:

```bash
yarn run dev-electron
```

### Build

Compile the application:

```bash
yarn run build
```

Output folders (in `dist/apps`):

- `ng-frontend`
- `nest-backend`

### Package

Build the Electron app:

```bash
yarn run package
```

Output will be in the `out` folder.

### Make

Generate a Windows x32/x64 zip file:

```bash
yarn run make
```

## Feedback and Contribution

We welcome your feedback and contributions! If you have suggestions or encounter issues, please file them in the issues section. For those interested in contributing, check out our contribution guidelines (coming soon).
