use base64::Engine;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{Listener, Manager, WebviewUrl};

use crate::{
    backend::{start_backend, stop_backend, BackendProcess, BACKEND_HEALTH_BUDGET},
    diagnostics::write_diagnostic_log,
};

/// Inline HTML for the splash screen, base64-encoded and loaded as a data: URL.
const SPLASH_HTML: &str = r##"<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Tag Check</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%}
body{
  background:linear-gradient(135deg,#1a237e 0%,#283593 50%,#3949ab 100%);
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,sans-serif;
  user-select:none;overflow:hidden;
}
.app-icon{
  width:64px;height:64px;margin-bottom:24px;
  background:rgba(255,255,255,0.15);
  border-radius:16px;
  display:flex;align-items:center;justify-content:center;
  font-size:32px;font-weight:300;
}
.app-name{font-size:26px;font-weight:600;letter-spacing:.5px;margin-bottom:36px}
.spinner{
  width:40px;height:40px;
  border:3px solid rgba(255,255,255,0.2);
  border-top-color:#fff;border-radius:50%;
  animation:spin .75s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg)}}
.status{margin-top:28px;font-size:13px;opacity:.65;animation:pulse 1.6s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.45}50%{opacity:.85}}
</style>
</head>
<body>
<div class="app-icon">&#10003;</div>
<div class="app-name">Tag Check</div>
<div class="spinner"></div>
<div class="status">Loading&#8230;</div>
</body>
</html>"##;

const SPLASH_TIMEOUT_MARGIN_SECS: u64 = 30;

#[derive(Default)]
struct SplashStartupState {
    frontend_ready: AtomicBool,
    backend_ready: AtomicBool,
    splash_closed: AtomicBool,
}

fn try_close_splash_window(
    app_handle: &tauri::AppHandle,
    startup_state: &SplashStartupState,
    reason: &str,
) {
    if !startup_state.frontend_ready.load(Ordering::SeqCst)
        || !startup_state.backend_ready.load(Ordering::SeqCst)
    {
        return;
    }

    if startup_state
        .splash_closed
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_err()
    {
        return;
    }

    write_diagnostic_log(
        app_handle,
        &format!("splash: both startup signals received, closing splash ({reason})"),
    );
    if let Some(splash) = app_handle.get_webview_window("splash") {
        let _: Result<(), _> = splash.close();
    }
}

/// Creates a small splash / loading window that appears immediately on launch.
fn create_splash_window(app_handle: &tauri::AppHandle) {
    let encoded = base64::engine::general_purpose::STANDARD.encode(SPLASH_HTML);
    let data_url = format!("data:text/html;base64,{encoded}");

    let url = match tauri::Url::parse(&data_url) {
        Ok(u) => u,
        Err(e) => {
            write_diagnostic_log(
                app_handle,
                &format!("splash: failed to parse data URL: {e}"),
            );
            return;
        }
    };

    match tauri::WebviewWindowBuilder::new(app_handle, "splash", WebviewUrl::External(url))
        .title("Tag Check")
        .inner_size(420.0, 320.0)
        .resizable(false)
        .decorations(false)
        .center()
        .build()
    {
        Ok(window) => {
            let _ = window.set_focus();
            write_diagnostic_log(app_handle, "splash: window created and shown");
        }
        Err(e) => {
            write_diagnostic_log(app_handle, &format!("splash: failed to create window: {e}"));
        }
    }
}

pub(crate) fn run() {
    let mut builder = tauri::Builder::default()
        .manage(BackendProcess::default())
        .plugin(tauri_plugin_shell::init());

    if cfg!(debug_assertions) {
        builder = builder.plugin(
            tauri_plugin_log::Builder::default()
                .level(log::LevelFilter::Info)
                .build(),
        );
    }

    let app = builder
        .setup(|app| {
            let app_handle = app.handle();
            let startup_state = Arc::new(SplashStartupState::default());

            // 1. Show splash screen immediately – gives the user visual feedback
            //    while the backend starts and the frontend bootstraps.
            write_diagnostic_log(app_handle, "setup: creating splash window");
            create_splash_window(app_handle);

            // 2. Listen for both startup signals. The splash only closes after
            //    the frontend has painted and the backend has passed health
            //    checks and shown the main window.
            let frontend_listener_handle = app_handle.clone();
            let frontend_startup_state = Arc::clone(&startup_state);
            app_handle.listen("app-ready", move |_event| {
                frontend_startup_state
                    .frontend_ready
                    .store(true, Ordering::SeqCst);
                write_diagnostic_log(
                    &frontend_listener_handle,
                    "splash: received app-ready event",
                );
                try_close_splash_window(
                    &frontend_listener_handle,
                    frontend_startup_state.as_ref(),
                    "app-ready",
                );
            });

            let backend_listener_handle = app_handle.clone();
            let backend_startup_state = Arc::clone(&startup_state);
            app_handle.listen("backend-ready", move |_event| {
                backend_startup_state
                    .backend_ready
                    .store(true, Ordering::SeqCst);
                write_diagnostic_log(
                    &backend_listener_handle,
                    "splash: received backend-ready event",
                );
                try_close_splash_window(
                    &backend_listener_handle,
                    backend_startup_state.as_ref(),
                    "backend-ready",
                );
            });

            // 3. Safety timeout: keep the splash alive for the full startup
            //    budget, but close it anyway if one of the readiness signals
            //    never arrives.
            let timeout_handle = app_handle.clone();
            let timeout_startup_state = Arc::clone(&startup_state);
            let splash_timeout = BACKEND_HEALTH_BUDGET
                .saturating_add(std::time::Duration::from_secs(SPLASH_TIMEOUT_MARGIN_SECS));
            std::thread::spawn(move || {
                std::thread::sleep(splash_timeout);
                if timeout_startup_state
                    .splash_closed
                    .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
                    .is_err()
                {
                    return;
                }
                if let Some(splash) = timeout_handle.get_webview_window("splash") {
                    let _: Result<(), _> = splash.close();
                    write_diagnostic_log(
                        &timeout_handle,
                        &format!(
                            "splash: timeout ({} s), closed splash window",
                            splash_timeout.as_secs()
                        ),
                    );
                }
            });

            // 4. Start the backend (this forks a thread that waits for the
            //    health check and then shows the main window).
            write_diagnostic_log(app_handle, "setup: starting backend bootstrap");
            start_backend(app_handle.clone())?;

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building the Tauri application");

    app.run(|app_handle, event| {
        if matches!(
            event,
            tauri::RunEvent::Exit | tauri::RunEvent::ExitRequested { .. }
        ) {
            stop_backend(app_handle);
        }
    });
}
