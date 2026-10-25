use std::sync::Mutex;

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

use crate::{
    diagnostics::write_diagnostic_log,
    run_status::{menu_label, IDLE_TEXT},
    window::{show_main_window, SPLASH_WINDOW_LABEL},
};

const TRAY_ID: &str = "tag-check-tray";
pub(crate) const MENU_STATUS_ID: &str = "tray-status";
pub(crate) const MENU_OPEN_ID: &str = "tray-open";
pub(crate) const MENU_QUIT_ID: &str = "tray-quit";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum TrayAction {
    /// Show and focus the main window.
    Open,
    /// Stop the backend sidecar and exit.
    Quit,
}

/// Maps a tray menu item id to its action.
pub(crate) fn tray_menu_action(menu_id: &str) -> Option<TrayAction> {
    match menu_id {
        MENU_OPEN_ID => Some(TrayAction::Open),
        MENU_QUIT_ID => Some(TrayAction::Quit),
        _ => None,
    }
}

/// A left click (on release) opens the main window; the right click opens
/// the menu.
fn tray_click_action(button: MouseButton, button_state: MouseButtonState) -> Option<TrayAction> {
    match (button, button_state) {
        (MouseButton::Left, MouseButtonState::Up) => Some(TrayAction::Open),
        _ => None,
    }
}

/// The tray parts that show the run status: the icon's tooltip and the
/// menu's first, disabled item (Linux trays show no tooltip).
pub(crate) struct TrayStatus {
    tray: TrayIcon,
    status_item: MenuItem<tauri::Wry>,
    /// The text shown, so an unchanged status is not set again.
    shown: Mutex<String>,
}

/// Shows `text` (already within the tooltip limit) as the tray tooltip and
/// the menu's status item. Does nothing before the tray exists.
pub(crate) fn show_tray_status(app_handle: &AppHandle, text: &str) {
    let Some(status) = app_handle.try_state::<TrayStatus>() else {
        return;
    };
    {
        let Ok(mut shown) = status.shown.lock() else {
            return;
        };
        if *shown == text {
            return;
        }
        text.clone_into(&mut shown);
    }
    if let Err(error) = status.tray.set_tooltip(Some(text)) {
        write_diagnostic_log(app_handle, &format!("tray: failed to set tooltip: {error}"));
    }
    if let Err(error) = status.status_item.set_text(menu_label(text)) {
        write_diagnostic_log(
            app_handle,
            &format!("tray: failed to set status item: {error}"),
        );
    }
}

/// Creates the tray icon with the app icon, a disabled run status item, an
/// "Open Tag Check" item and a "Quit" item.
pub(crate) fn create_tray(app_handle: &AppHandle) -> tauri::Result<()> {
    let status_item = MenuItem::with_id(
        app_handle,
        MENU_STATUS_ID,
        menu_label(IDLE_TEXT),
        false,
        None::<&str>,
    )?;
    let open_item = MenuItem::with_id(
        app_handle,
        MENU_OPEN_ID,
        "Open Tag Check",
        true,
        None::<&str>,
    )?;
    let separator = PredefinedMenuItem::separator(app_handle)?;
    let quit_item = MenuItem::with_id(app_handle, MENU_QUIT_ID, "Quit", true, None::<&str>)?;
    let status_separator = PredefinedMenuItem::separator(app_handle)?;
    let menu = Menu::with_items(
        app_handle,
        &[
            &status_item,
            &status_separator,
            &open_item,
            &separator,
            &quit_item,
        ],
    )?;

    let mut builder = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip(IDLE_TEXT)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app_handle, event| {
            if let Some(action) = tray_menu_action(event.id().as_ref()) {
                run_tray_action(app_handle, action);
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button,
                button_state,
                ..
            } = event
            {
                if let Some(action) = tray_click_action(button, button_state) {
                    run_tray_action(tray.app_handle(), action);
                }
            }
        });
    if let Some(icon) = app_handle.default_window_icon() {
        builder = builder.icon(icon.clone());
    }
    let tray = builder.build(app_handle)?;
    app_handle.manage(TrayStatus {
        tray,
        status_item,
        shown: Mutex::new(IDLE_TEXT.to_string()),
    });
    write_diagnostic_log(app_handle, "tray: icon created");
    Ok(())
}

fn run_tray_action(app_handle: &AppHandle, action: TrayAction) {
    match action {
        TrayAction::Open => open_from_tray(app_handle),
        TrayAction::Quit => {
            write_diagnostic_log(app_handle, "tray: quit requested");
            // `exit` raises `RunEvent::ExitRequested` and `RunEvent::Exit`;
            // the run loop stops the backend sidecar on both.
            app_handle.exit(0);
        }
    }
}

fn open_from_tray(app_handle: &AppHandle) {
    match show_main_window(app_handle) {
        Ok(true) => {}
        // The backend is still starting and the main window does not exist
        // yet; bring the splash forward instead of creating a window.
        Ok(false) => {
            if let Some(splash) = app_handle.get_webview_window(SPLASH_WINDOW_LABEL) {
                let _ = splash.show();
                let _ = splash.set_focus();
            }
        }
        Err(error) => write_diagnostic_log(
            app_handle,
            &format!("tray: failed to show main window: {error}"),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_menu_ids_to_actions() {
        assert_eq!(tray_menu_action(MENU_OPEN_ID), Some(TrayAction::Open));
        assert_eq!(tray_menu_action(MENU_QUIT_ID), Some(TrayAction::Quit));
    }

    #[test]
    fn ignores_unknown_menu_ids() {
        assert_eq!(tray_menu_action("quit"), None);
        assert_eq!(tray_menu_action(MENU_STATUS_ID), None);
        assert_eq!(tray_menu_action(""), None);
    }

    #[test]
    fn opens_on_left_button_release_only() {
        assert_eq!(
            tray_click_action(MouseButton::Left, MouseButtonState::Up),
            Some(TrayAction::Open)
        );
        assert_eq!(
            tray_click_action(MouseButton::Left, MouseButtonState::Down),
            None
        );
        assert_eq!(
            tray_click_action(MouseButton::Right, MouseButtonState::Up),
            None
        );
        assert_eq!(
            tray_click_action(MouseButton::Middle, MouseButtonState::Up),
            None
        );
    }
}
