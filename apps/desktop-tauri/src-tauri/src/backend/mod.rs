use std::time::Duration;

mod health;
mod paths;
mod process;

pub(crate) use process::{start_backend, stop_backend, BackendProcess};

pub(super) const DATABASE_FILE_NAME: &str = "data.sqlite3";
pub(super) const DEFAULT_PORT: u16 = 7001;
pub(super) const DEFAULT_WEB_SOCKET: u16 = 7002;
pub(super) const HEALTH_PORTS: [u16; 1] = [DEFAULT_PORT];
pub(super) const HEALTH_TIMEOUT: Duration = Duration::from_secs(2);
pub(super) const MAX_HEALTH_ATTEMPTS: usize = 30;
pub(crate) const BACKEND_HEALTH_BUDGET: Duration =
    Duration::from_secs(HEALTH_TIMEOUT.as_secs() * MAX_HEALTH_ATTEMPTS as u64);
pub(super) const PROJECTS_DIR_NAME: &str = "tag_check_projects";
