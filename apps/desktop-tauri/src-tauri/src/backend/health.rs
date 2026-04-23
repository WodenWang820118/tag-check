use std::{
    io::{Read, Write},
    net::{TcpStream, ToSocketAddrs},
    thread,
};

use tauri::AppHandle;

use super::{HEALTH_PORTS, HEALTH_TIMEOUT, MAX_HEALTH_ATTEMPTS};
use crate::diagnostics::write_diagnostic_log;

pub(super) fn wait_for_backend(app_handle: &AppHandle) -> bool {
    for _ in 0..MAX_HEALTH_ATTEMPTS {
        for port in HEALTH_PORTS {
            if check_backend_health(port) {
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
