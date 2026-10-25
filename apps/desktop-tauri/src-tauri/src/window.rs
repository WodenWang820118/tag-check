use tauri::{AppHandle, Manager, Window, WindowEvent};

use crate::diagnostics::write_diagnostic_log;

pub(crate) const MAIN_WINDOW_LABEL: &str = "main";
pub(crate) const SPLASH_WINDOW_LABEL: &str = "splash";

/// What a close request on a window does.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CloseAction {
    /// Keep the window and hide it; the app keeps running in the tray.
    HideToTray,
    /// Let the window close.
    Close,
}

/// Closing the main window hides it to the tray, so the backend sidecar
/// keeps running. Every other window (the splash) closes normally.
pub(crate) fn close_action(window_label: &str) -> CloseAction {
    if window_label == MAIN_WINDOW_LABEL {
        CloseAction::HideToTray
    } else {
        CloseAction::Close
    }
}

/// Handles window events for every window of the app.
pub(crate) fn on_window_event(window: &Window, event: &WindowEvent) {
    let WindowEvent::CloseRequested { api, .. } = event else {
        return;
    };
    if close_action(window.label()) != CloseAction::HideToTray {
        return;
    }

    api.prevent_close();
    let app_handle = window.app_handle();
    match window.hide() {
        // The first hide shows no notice; the tray icon's tooltip says Tag
        // Check keeps running, or which test runs.
        Ok(()) => write_diagnostic_log(app_handle, "window: main window hidden to tray"),
        Err(error) => write_diagnostic_log(
            app_handle,
            &format!("window: failed to hide main window: {error}"),
        ),
    }
}

/// Shows, restores and focuses the existing main window. Returns `false`
/// when the main window does not exist yet (the backend is still starting);
/// the caller never creates a second window or webview.
pub(crate) fn show_main_window(app_handle: &AppHandle) -> tauri::Result<bool> {
    let Some(window) = app_handle.get_webview_window(MAIN_WINDOW_LABEL) else {
        return Ok(false);
    };
    window.show()?;
    if window.is_minimized()? {
        window.unminimize()?;
    }
    window.set_focus()?;
    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn hides_the_main_window_to_the_tray() {
        assert_eq!(close_action(MAIN_WINDOW_LABEL), CloseAction::HideToTray);
    }

    #[test]
    fn closes_the_splash_window() {
        assert_eq!(close_action(SPLASH_WINDOW_LABEL), CloseAction::Close);
    }

    #[test]
    fn closes_any_other_window() {
        assert_eq!(close_action("devtools"), CloseAction::Close);
        assert_eq!(close_action(""), CloseAction::Close);
        assert_eq!(close_action("Main"), CloseAction::Close);
    }
}
