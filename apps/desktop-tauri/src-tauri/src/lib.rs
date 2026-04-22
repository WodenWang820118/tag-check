use std::{
    fs,
    fs::OpenOptions,
    io::{Read, Write},
    net::{TcpStream, ToSocketAddrs},
    path::PathBuf,
    sync::Mutex,
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};

use tauri::{path::BaseDirectory, AppHandle, Manager};
use tauri_plugin_shell::{
    process::{CommandChild, CommandEvent},
    ShellExt,
};

const DATABASE_FILE_NAME: &str = "data.sqlite3";
const DEFAULT_PORT: &str = "7001";
const DEFAULT_WEB_SOCKET: &str = "7002";
const DEV_HEALTH_PORTS: [u16; 3] = [7070, 6060, 7001];
const HEALTH_TIMEOUT: Duration = Duration::from_secs(2);
const LOG_FILE_NAME: &str = "desktop-tauri.log";
const MAX_HEALTH_ATTEMPTS: usize = 30;
const PROD_HEALTH_PORTS: [u16; 1] = [7001];
const PROJECTS_DIR_NAME: &str = "tag_check_projects";

#[derive(Default)]
struct BackendProcess(Mutex<Option<CommandChild>>);

struct BackendPaths {
    backend_dir: PathBuf,
    database_path: PathBuf,
    main_script_path: PathBuf,
    projects_path: PathBuf,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
            write_diagnostic_log(app.handle(), "setup: starting backend bootstrap");
            start_backend(app.handle().clone())?;
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

fn start_backend(app_handle: AppHandle) -> Result<(), Box<dyn std::error::Error>> {
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

    let diagnostics_handle = app_handle.clone();
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
    });

    let show_window_handle = app_handle.clone();
    thread::spawn(move || {
        if wait_for_backend(&show_window_handle) {
            write_diagnostic_log(
                &show_window_handle,
                "health check succeeded, showing window",
            );
            if let Some(window) = show_window_handle.get_webview_window("main") {
                let _ = window.show();
                let _ = window.set_focus();
            }
        } else {
            write_diagnostic_log(
                &show_window_handle,
                "timed out while waiting for backend health check; exiting app",
            );
            eprintln!("[desktop-tauri] Timed out while waiting for the backend health check.");
            stop_backend(&show_window_handle);
            show_window_handle.exit(1);
        }
    });

    Ok(())
}

fn resolve_backend_paths(
    app_handle: &AppHandle,
) -> Result<BackendPaths, Box<dyn std::error::Error>> {
    let app_data_dir = app_handle.path().app_data_dir()?;
    fs::create_dir_all(&app_data_dir)?;

    let projects_path = app_data_dir.join(PROJECTS_DIR_NAME);
    fs::create_dir_all(&projects_path)?;

    let backend_dir = normalize_process_path(if tauri::is_dev() {
        std::env::current_dir()?
            .join("dist")
            .join("apps")
            .join("nest-backend")
    } else {
        app_handle
            .path()
            .resolve("backend", BaseDirectory::Resource)?
    });

    let main_script_path = normalize_process_path(backend_dir.join("main.js"));

    if !main_script_path.exists() {
        return Err(format!(
            "Expected backend entrypoint at {}. Run the desktop-tauri prepare step first.",
            main_script_path.display()
        )
        .into());
    }

    Ok(BackendPaths {
        backend_dir,
        database_path: app_data_dir.join(DATABASE_FILE_NAME),
        main_script_path,
        projects_path,
    })
}

fn stop_backend(app_handle: &AppHandle) {
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

fn wait_for_backend(app_handle: &AppHandle) -> bool {
    let ports = if tauri::is_dev() {
        DEV_HEALTH_PORTS.as_slice()
    } else {
        PROD_HEALTH_PORTS.as_slice()
    };

    for _ in 0..MAX_HEALTH_ATTEMPTS {
        for port in ports {
            if check_backend_health(*port) {
                write_diagnostic_log(
                    app_handle,
                    &format!("health check passed on http://127.0.0.1:{port}/health"),
                );
                return true;
            }
        }

        thread::sleep(HEALTH_TIMEOUT);
    }

    false
}

fn write_diagnostic_log(app_handle: &AppHandle, message: &str) {
    let log_path = app_handle
        .path()
        .app_data_dir()
        .map(|dir| dir.join(LOG_FILE_NAME))
        .unwrap_or_else(|_| std::env::temp_dir().join(LOG_FILE_NAME));

    if let Some(parent) = log_path.parent() {
        let _ = fs::create_dir_all(parent);
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_secs())
        .unwrap_or_default();

    if let Ok(mut file) = OpenOptions::new().create(true).append(true).open(log_path) {
        let _ = writeln!(file, "[{timestamp}] {message}");
    }
}

fn normalize_process_path(path: PathBuf) -> PathBuf {
    #[cfg(windows)]
    {
        let path_string = path.to_string_lossy();

        if let Some(stripped) = path_string.strip_prefix(r"\\?\UNC\") {
            return PathBuf::from(format!(r"\\{stripped}"));
        }

        if let Some(stripped) = path_string.strip_prefix(r"\\?\") {
            return PathBuf::from(stripped);
        }
    }

    path
}

fn check_backend_health(port: u16) -> bool {
    let socket_address = match format!("127.0.0.1:{port}").to_socket_addrs() {
        Ok(mut addresses) => match addresses.next() {
            Some(address) => address,
            None => return false,
        },
        Err(_) => return false,
    };

    let mut stream = match TcpStream::connect_timeout(&socket_address, HEALTH_TIMEOUT) {
        Ok(stream) => stream,
        Err(_) => return false,
    };

    let _ = stream.set_read_timeout(Some(HEALTH_TIMEOUT));
    let _ = stream.set_write_timeout(Some(HEALTH_TIMEOUT));

    if stream
        .write_all(b"GET /health HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n")
        .is_err()
    {
        return false;
    }

    let mut response = String::new();
    if stream.read_to_string(&mut response).is_err() {
        return false;
    }

    response.contains("\"status\":\"ok\"") || response.contains("\"status\": \"ok\"")
}
