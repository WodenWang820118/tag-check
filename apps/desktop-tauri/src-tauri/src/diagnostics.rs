use std::{
    fs,
    fs::OpenOptions,
    io::Write,
    time::{SystemTime, UNIX_EPOCH},
};

use tauri::{AppHandle, Manager};

const LOG_FILE_NAME: &str = "desktop-tauri.log";

pub(crate) fn write_diagnostic_log(app_handle: &AppHandle, message: &str) {
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
