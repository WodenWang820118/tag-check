use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
};

use tauri::{AppHandle, Emitter, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

use super::{
    health::wait_for_backend, paths::resolve_backend_paths, DEFAULT_PORT, DEFAULT_WEB_SOCKET,
};
use crate::diagnostics::write_diagnostic_log;

#[derive(Default)]
pub(crate) struct BackendProcess(Mutex<Option<CommandChild>>);

fn create_or_show_main_window(app_handle: &AppHandle) -> tauri::Result<()> {
    if let Some(window) = app_handle.get_webview_window("main") {
        window.show()?;
        window.set_focus()?;
        return Ok(());
    }

    write_diagnostic_log(
        app_handle,
        "backend readiness satisfied, creating main window and loading frontend",
    );
    let window =
        WebviewWindowBuilder::new(app_handle, "main", WebviewUrl::App("index.html".into()))
            .title("Tag Check")
            .inner_size(1400.0, 900.0)
            .resizable(true)
            .fullscreen(false)
            .visible(true)
            .build()?;
    window.set_focus()?;
    Ok(())
}

pub(crate) fn start_backend(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let backend_paths = resolve_backend_paths(&app_handle)?;
    write_diagnostic_log(
        &app_handle,
        &format!(
            "backend paths: backend_dir={} main_script={} database={} projects={}",
            backend_paths.backend_dir.display(),
            backend_paths.main_script_path.display(),
            backend_paths.database_path.display(),
            backend_paths.projects_path.display()
        ),
    );

    let environment = vec![
        (
            "NODE_ENV".to_string(),
            if tauri::is_dev() {
                "dev".to_string()
            } else {
                "prod".to_string()
            },
        ),
        ("PORT".to_string(), DEFAULT_PORT.to_string()),
        ("WEB_SOCKET".to_string(), DEFAULT_WEB_SOCKET.to_string()),
        (
            "ROOT_PROJECT_PATH".to_string(),
            backend_paths.projects_path.to_string_lossy().into_owned(),
        ),
        (
            "DATABASE_PATH".to_string(),
            backend_paths.database_path.to_string_lossy().into_owned(),
        ),
        // Persistent V8 compile cache directory. After the first launch, Node
        // re-uses cached bytecode and skips parsing the bundled main.js,
        // which materially reduces cold start time on subsequent launches.
        (
            "NODE_COMPILE_CACHE".to_string(),
            backend_paths
                .compile_cache_dir
                .to_string_lossy()
                .into_owned(),
        ),
    ];
    write_diagnostic_log(
        &app_handle,
        &format!(
            "spawning sidecar node.exe with NODE_ENV={} PORT={} WEB_SOCKET={}",
            if tauri::is_dev() { "dev" } else { "prod" },
            DEFAULT_PORT,
            DEFAULT_WEB_SOCKET
        ),
    );

    let sidecar = app_handle
        .shell()
        .sidecar("node")?
        .arg(&backend_paths.main_script_path)
        .current_dir(&backend_paths.backend_dir)
        .envs(environment);

    let (rx, child) = sidecar.spawn()?;
    let child_pid = child.pid();
    write_diagnostic_log(
        &app_handle,
        &format!("sidecar spawned successfully with pid={child_pid}"),
    );

    {
        let state = app_handle.state::<BackendProcess>();
        *state.0.lock().expect("backend mutex poisoned") = Some(child);
    }

    let backend_terminated = Arc::new(AtomicBool::new(false));
    let diagnostics_handle = app_handle.clone();
    let diagnostics_backend_terminated = Arc::clone(&backend_terminated);
    tauri::async_runtime::spawn(async move {
        let mut rx = rx;
        while let Some(event) = rx.recv().await {
            match event {
                CommandEvent::Stdout(line) => {
                    write_diagnostic_log(
                        &diagnostics_handle,
                        &format!("backend stdout: {}", String::from_utf8_lossy(&line).trim()),
                    );
                    println!(
                        "[desktop-tauri][backend] {}",
                        String::from_utf8_lossy(&line)
                    );
                }
                CommandEvent::Stderr(line) => {
                    write_diagnostic_log(
                        &diagnostics_handle,
                        &format!("backend stderr: {}", String::from_utf8_lossy(&line).trim()),
                    );
                    eprintln!(
                        "[desktop-tauri][backend][stderr] {}",
                        String::from_utf8_lossy(&line)
                    );
                }
                CommandEvent::Error(error) => {
                    write_diagnostic_log(
                        &diagnostics_handle,
                        &format!("backend command error: {error}"),
                    );
                }
                CommandEvent::Terminated(payload) => {
                    diagnostics_backend_terminated.store(true, Ordering::Relaxed);
                    write_diagnostic_log(
                        &diagnostics_handle,
                        &format!(
                            "backend terminated: code={:?} signal={:?}",
                            payload.code, payload.signal
                        ),
                    );
                }
                _ => {}
            }
        }
        diagnostics_backend_terminated.store(true, Ordering::Relaxed);
    });

    let show_window_handle = app_handle.clone();
    let health_backend_terminated = Arc::clone(&backend_terminated);
    thread::spawn(move || {
        if wait_for_backend(&show_window_handle, health_backend_terminated.as_ref()) {
            write_diagnostic_log(
                &show_window_handle,
                "backend startup seed readiness succeeded",
            );
            if let Err(error) = create_or_show_main_window(&show_window_handle) {
                write_diagnostic_log(
                    &show_window_handle,
                    &format!("failed to create main window after backend readiness: {error}"),
                );
                eprintln!(
                    "[desktop-tauri] Failed to create main window after backend readiness: {error}"
                );
                stop_backend(&show_window_handle);
                show_window_handle.exit(1);
                return;
            }
            if let Err(error) = show_window_handle.emit("backend-ready", ()) {
                write_diagnostic_log(
                    &show_window_handle,
                    &format!("failed to emit backend-ready event: {error}"),
                );
            }
        } else {
            write_diagnostic_log(
                &show_window_handle,
                "timed out while waiting for backend startup seed readiness; exiting app",
            );
            eprintln!(
                "[desktop-tauri] Timed out while waiting for backend startup seed readiness."
            );
            stop_backend(&show_window_handle);
            show_window_handle.exit(1);
        }
    });

    Ok(())
}

pub(crate) fn stop_backend(app_handle: &AppHandle) {
    if let Ok(mut guard) = app_handle.state::<BackendProcess>().0.lock() {
        if let Some(child) = guard.take() {
            write_diagnostic_log(
                app_handle,
                &format!("stopping backend sidecar pid={}", child.pid()),
            );
            let _ = child.kill();
        }
    }
}
