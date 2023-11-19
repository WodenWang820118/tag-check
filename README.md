# DatalayerChecker

## How to use the backend

### Set up a project

1. `http://localhost:8080/waiter-path/setRootProjectFolder` to set a global root folder.

- rootProjectFolder: the path of the root folder

2. `http://localhost:8080/waiter-path/setRootProjectFolder` to initialize a project.

- projectName: the name of the project
- Once the project is initiated, all default settings and folders will be created.
- Please update all recordings under the `recordings` folder.

3. `http://localhost:8080/waiter-path/setRootProjectFolder` to set a project folder if you want to change the project folder. The `cachedSettings.json` will be updated under the project folder.

- projectName: the name of the project

### Start checking the data layer

- `http://localhost:8080/waiter-datalayer/singleEvent`
- projectName: the name of the project
- headless: 'new' or false
- testName: the name of the test

### Start checking the data layer with multiple events

- `http://localhost:8080/waiter-datalayer/project`
- projectName: the name of the project
- headless: 'new' or false
- concurrency: the number of concurrent tests

### Start checking the data layer with a single event and with GTM preview mode

- `http://localhost:8080/waiter-gtm-operator`
- projectName: the name of the project
- headless: 'new' or false
- testName: the name of the test
- gtmUrl: the GTM preview mode sharable URL

### Start checking the data layer with multiple events and with GTM preview mode (TBC)

# Backend development

This version mimics users' behaviors to using the app.

Please use the following command to run the backend server:

```bash
npm run backend
```

Then, you can route to http://localhost:8080/api to see exposed APIs.
