# Setting details

Each project has its own settings, under **Settings** in the project's menu. Select **Save** on a page to keep its changes.

## Project Information

- **Project Name**: the name shown on the Projects page.
- **Measurement ID**: the GA4 measurement ID the site sends to. The request check looks for GA4 requests sent to it.
- **Project Description**: optional notes.

## Pre-loading Values

Values TagCheck sets before each run, so the site starts in the state the test needs:

- **Website URL**: the site under test. TagCheck sets the cookies below on its domain.
- **Local Storage**: key and value pairs, such as a consent state the site keeps in local storage. TagCheck writes them before the scripts of each page the run opens.
- **Cookie**: name and value pairs, such as a consent cookie.

Without consent, many sites block analytics tags, and both checks fail.

## Authentication

A **Username** and **Password** for sites behind HTTP authentication. TagCheck sends them when the site asks.

## Google Tag Manager

- **Activate Accompanied Mode**: runs each test through GTM Preview, so the tags under test are those of the previewed workspace. It needs the Preview Mode URL.
- **Activate Request Check**: checks the GA4 request as well as the data layer. It needs the measurement ID.
- **GTM URL**: the address of the container's workspace in Tag Manager, kept for reference.
- **Preview Mode URL**: the Tag Assistant address for your preview session. Start **Preview** in Tag Manager and copy the address Tag Assistant shows; it includes the container ID and the site, such as `https://tagassistant.google.com/#/?id=GTM-XXXXXXX&url=https%3A%2F%2Fexample.com`.

## Browser Settings

- **Hide the browser?**: runs Chrome without a window. Accompanied Mode always shows the window.
- **Add browser setting**: adds a Chrome command-line argument for runs, such as `--window-size=1280,800`.

## AI Assist

These settings apply to every project on this computer. When a step cannot find its element, a model on this computer suggests replacement selectors. The model runs in [Ollama](https://ollama.com), so page data does not leave the computer. A suggestion changes a recording only when you save it, and a test still passes only on its own checks.

- **Suggest replacements when a step cannot find its element**: off by default.
- **Ollama address**: where Ollama listens, on this computer only (`localhost`, `127.0.0.1` or `[::1]`). The default is `http://127.0.0.1:11434`.
- **Model**: the Ollama model to ask, such as `qwen3.5:9b`. The list offers the models Ollama has.

Below the form, the page says whether Ollama answered with the model. TagCheck never installs Ollama or downloads a model: when Ollama is not running, start it; when the model is missing, the page shows the `ollama pull` command to run in a terminal. Then select **Check again**.

## Export or Delete

- **Export**: downloads the project, with its tests, specs, recordings and results, as a ZIP file. Import it on another computer with **Already got the project?** on the New Project page.
- **Delete**: deletes the project and everything in it. This cannot be undone.
