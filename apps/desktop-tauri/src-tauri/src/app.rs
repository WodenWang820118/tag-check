use crate::{
    backend::{start_backend, stop_backend, BackendProcess},
    diagnostics::write_diagnostic_log,
};

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
