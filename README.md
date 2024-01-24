# DatalayerChecker

// TODO: remember to add the sqlite3 file to the package

## Table of Contents

[Overview](#overview)
[Configuration](#configuration)
[Frontend](#frontend)
[Backend](#backend)
[Application](#application)
[Package](#package)
[Development](#development)

## Overview

Currently, this project is still under development. The goal is to provide a tool to check the data layer of a website. The tool will mimic users' behaviors to check the data layer. The tool will also provide a way to check the data layer with GTM preview mode.

## Configuration

Please create a `.env` file in the root folder and add the following content:

```
NODE_ENV=development
```

The `NODE_ENV` can be `development` or `production`.
There could be more configurations in the future.

## Frontend

Please use the following command to run the frontend server:

```bash
npm run frontend
```

## Backend

Please use the following command to run the backend server:

```bash
npm run backend
```

To see exposed APIs, please route to http://localhost:8080/api.

## Application

Please use the following command to build the application:

```bash
npm run build
```

Please use the following command to run the application:

```bash
npm run app
```

## Package

To build the electron app, refer to the documentation [here](https://www.electronjs.org/docs/latest/tutorial/tutorial-packaging) and change the `main` in `package.json` to the specific file path. In the project, it's `apps/frontend/main.js`. The output will be in the `out` folder.

Please run the command to build the Electron app:

```bash
npm run package
```

The package will be in the `out` folder. The backend server will be in the `resources` folder, named `main.js`.

## Development

Please use the following command to run the application in development mode:

```bash
npm run dev-app
```
