# Report Management

Each report represents a test case with several components. The purpose of the report gives the overall picture of a test case and it allows users to interact with the system and make changes as needed.

## Status Bar

In the detail report view, the page will show a brief status bar to indicate the test's status.

## Screenshot

The scrrenshot gives the visual proof and it is taken at the place where the event is triggered or after the event is triggered.

## Functional Panel

The functional panel is similar to the dashboard.

### **Data Layer Spec**

The spec is edittable and when it is changed, other reports using the same spec will also be affected.

### **Chrome Recording**

The recording is from the Chrome's recorder, downloaded as the JSON format. We can edit the recording directly or upload a new one to overwrite the existing one.

### **Raw Request**

If enabing the request inception feature, the raw request will be shown here. In case the system mis-judge the test result, the raw request is used as the proof to cross-validate the test results.

### **Request Data Layer**

The raw request will be re-structured as data layer alike object to reuse the examaination logic. It may have extra parameters extracted from the request.

### **Data Layer**

The data layer is situated under the browser's global window object. You may type `window.dataLayer` and press the `Enter` key to show the entire data layer object. The system will extract the object within the data layer and show it here.
