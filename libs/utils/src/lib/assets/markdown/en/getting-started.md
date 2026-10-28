# Getting started

This guide takes you from a new project to your first result. The example project that comes with TagCheck runs against the demo store at https://ng-gtm-sample.vercel.app and shows every step already done.

## 1. Create a project

On the **Projects** page, select **New Project** (+) and fill in:

- **Project Name**: TagCheck derives the project slug from it.
- **Measurement ID**: the GA4 measurement ID the site sends to, such as `G-8HKQR5ZBSK`. The request check needs it.
- **Project Description**: optional.

To continue a project exported from TagCheck, use **Already got the project?** on the same page and upload its ZIP file.

## 2. Prepare the site

Open the project and go to **Settings**:

- **Pre-loading Values**: enter the **Website URL**, and the local storage items and cookies the site needs before a run. A typical example is a consent value, so that the site allows its analytics tags to fire.
- **Google Tag Manager**: turn on **Activate Request Check** to check GA4 requests as well as the data layer.
- **Authentication**: enter a username and password if the site is behind HTTP authentication.

## 3. Add tests

On the **Tests** page, select **Add tests** (+). There are three ways:

- **Import GTM JSON** (recommended): in Tag Manager, go to **Admin** > **Export container** and upload the file. TagCheck creates one test per GA4 event tag. Each spec lists the parameters the tag reads from Data Layer Variables, and those keys must exist in the push. Tags TagCheck cannot turn into tests are listed under **Skipped tags**. When a tag name already has a test but the event name changed, TagCheck asks whether to update that test or keep both.
- **Import GA4 events**: upload or paste the events you plan to push, as one JSON object or an array, and select **Create tests**.
- **Create a test manually**: write the spec and paste a recording in the editors, then select **Submit**.

On the project's **TagBuild** page, **Import into this project** adds the container just built as tests, with the same conflict check as **Import GTM JSON**.

Tag Extract on that page offers **Use this project's container** when the project already has an imported container, and reads that container instead of a new upload.

## 4. Record the journey

Each test replays a Chrome Recorder recording that ends with the action that pushes its event.

1. In Chrome, open DevTools and the **Recorder** panel, and record the journey on your site: for example, open a product page and select **Add to cart**.
2. Export the recording as a JSON file.
3. Open the test and expand **Spec, recording and item definition**. In the **Chrome Recording** panel, select the edit button, **Upload** the file or paste its content, and select **Save**.

TagCheck replays the steps `setViewport`, `navigate`, `click`, `hover`, `change`, `keyDown`, `keyUp` and `waitForElement`, with CSS, ID, ARIA, text, XPath and pierce selectors. It also follows selector chains into shadow roots, runs steps inside iframes, and waits for the page a step opens when the recording says the step navigates. Before you record, set the Recorder's **Selector attribute** to `data-testid` (or the test attribute your site uses) and keep every selector type selected: stable selectors keep recordings working after design changes. When none of a step's selectors matches, TagCheck looks for exactly one element with the recorded test hook, id or name, continues with it and says so in the result (see Report management).

## 5. Run a test

Select the play button at the end of the test's row. A progress chart follows the recording's steps. To stop a run, select **Stop the running test** in the toolbar.

When the run ends, the row shows the new status. Open the test to see the result: the checks, the captured `dataLayer`, the GA4 request, a screenshot and a screen recording. **Report management** explains each part.
