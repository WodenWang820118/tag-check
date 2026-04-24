use std::{fs, path::PathBuf};

use tauri::{path::BaseDirectory, AppHandle, Manager};

use super::{DATABASE_FILE_NAME, PROJECTS_DIR_NAME};

pub(super) struct BackendPaths {
    pub(super) backend_dir: PathBuf,
    pub(super) database_path: PathBuf,
    pub(super) main_script_path: PathBuf,
    pub(super) projects_path: PathBuf,
}

pub(super) fn resolve_backend_paths(
    app_handle: &AppHandle,
) -> Result<BackendPaths, Box<dyn std::error::Error>> {
    let app_data_dir = app_handle.path().app_data_dir()?;
    fs::create_dir_all(&app_data_dir)?;

    let projects_path = app_data_dir.join(PROJECTS_DIR_NAME);
    fs::create_dir_all(&projects_path)?;

    let backend_dir = normalize_process_path(if tauri::is_dev() {
        resolve_dev_backend_dir()
    } else {
        app_handle.path().resolve("backend", BaseDirectory::Resource)?
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

fn resolve_dev_backend_dir() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("..")
        .join("..")
        .join("..")
        .join("dist")
        .join("apps")
        .join("nest-backend")
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
