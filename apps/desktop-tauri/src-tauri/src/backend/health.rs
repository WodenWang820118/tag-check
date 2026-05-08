use std::{
    io::{Read, Write},
    net::{TcpStream, ToSocketAddrs},
    sync::atomic::{AtomicBool, Ordering},
    thread,
};

use tauri::AppHandle;

use super::{HEALTH_PORTS, HEALTH_TIMEOUT, MAX_HEALTH_ATTEMPTS};
use crate::diagnostics::write_diagnostic_log;

const MAX_HEALTH_RESPONSE_BYTES: u64 = 8 * 1024;

pub(super) fn wait_for_backend(app_handle: &AppHandle, backend_terminated: &AtomicBool) -> bool {
    write_diagnostic_log(app_handle, "waiting for backend startup seed readiness");

    for attempt in 1..=MAX_HEALTH_ATTEMPTS {
        if backend_terminated.load(Ordering::Relaxed) {
            return false;
        }

        for port in HEALTH_PORTS {
            if check_backend_startup_seed_readiness(port) {
                write_diagnostic_log(
                    app_handle,
                    &format!(
                        "startup seed readiness passed on http://127.0.0.1:{port}/startup/project-seed-readiness after attempt {attempt}"
                    ),
                );
                return true;
            }
        }

        if backend_terminated.load(Ordering::Relaxed) {
            return false;
        }

        thread::sleep(HEALTH_TIMEOUT);
    }

    false
}

fn check_backend_startup_seed_readiness(port: u16) -> bool {
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
        .write_all(
            b"GET /startup/project-seed-readiness HTTP/1.1\r\nHost: localhost\r\nConnection: close\r\n\r\n",
        )
        .is_err()
    {
        return false;
    }

    let mut response = String::new();
    if stream
        .take(MAX_HEALTH_RESPONSE_BYTES)
        .read_to_string(&mut response)
        .is_err()
    {
        return false;
    }

    is_startup_seed_ready_response(&response)
}

fn is_startup_seed_ready_response(response: &str) -> bool {
    let Some((headers, body)) = response.split_once("\r\n\r\n") else {
        return false;
    };
    let Some(status_code) = headers
        .lines()
        .next()
        .and_then(|status_line| status_line.split_whitespace().nth(1))
        .and_then(|raw_status| raw_status.parse::<u16>().ok())
    else {
        return false;
    };

    if status_code != 200 {
        return false;
    }

    let Ok(body) = serde_json::from_str::<serde_json::Value>(body) else {
        return false;
    };

    body.get("ready").is_some_and(|ready| ready == true)
        && body
            .get("projectCount")
            .and_then(|project_count| project_count.as_u64())
            .is_some_and(|project_count| project_count > 0)
}

#[cfg(test)]
mod tests {
    use super::is_startup_seed_ready_response;

    #[test]
    fn accepts_200_response_when_startup_seed_is_ready() {
        assert!(is_startup_seed_ready_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"ready\":true,\"projectCount\":1}"
        ));
    }

    #[test]
    fn rejects_response_until_startup_seed_is_ready() {
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"ready\":false,\"projectCount\":0}"
        ));
    }

    #[test]
    fn rejects_ready_response_without_visible_projects() {
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"ready\":true,\"projectCount\":0}"
        ));
    }

    #[test]
    fn rejects_non_200_response_even_when_startup_seed_is_ready() {
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\n\r\n{\"ready\":true,\"projectCount\":1}"
        ));
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"ready\":true,\"projectCount\":1}"
        ));
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 201 Created\r\nContent-Type: application/json\r\n\r\n{\"ready\":true,\"projectCount\":1}"
        ));
    }

    #[test]
    fn rejects_project_list_responses_without_readiness_contract() {
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n[{\"projectSlug\":\"example-project-slug\"}]"
        ));
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n[]"
        ));
    }

    #[test]
    fn rejects_health_ok_without_startup_seed_readiness() {
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\"}"
        ));
    }

    #[test]
    fn rejects_200_response_with_invalid_json() {
        assert!(!is_startup_seed_ready_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\nnot-json"
        ));
    }

    #[test]
    fn rejects_200_response_with_empty_body() {
        assert!(!is_startup_seed_ready_response("HTTP/1.1 200 OK\r\n\r\n"));
    }

    #[test]
    fn rejects_malformed_http_response() {
        assert!(!is_startup_seed_ready_response(
            "[{\"projectSlug\":\"example-project-slug\"}]"
        ));
    }
}
