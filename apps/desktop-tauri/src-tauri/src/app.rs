use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};
use tauri::{Listener, Manager, WebviewUrl};

use crate::{
    backend::{start_backend, stop_backend, BackendProcess, BACKEND_HEALTH_BUDGET},
    diagnostics::write_diagnostic_log,
};
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
    match tauri::WebviewWindowBuilder::new(
        app_handle,
        "splash",
        WebviewUrl::App("splash.html".into()),
    )
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

            // 1. Show splash screen immediately to give the user visual feedback
            //    while the backend reaches startup data readiness.
            write_diagnostic_log(app_handle, "setup: creating splash window");
            create_splash_window(app_handle);

            // 2. Listen for both startup signals. The splash only closes after
            //    the backend startup seed is complete and the main frontend has
            //    painted.
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
            //    startup-seed readiness check, then creates and loads main).
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
