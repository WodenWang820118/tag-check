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
    for _ in 0..MAX_HEALTH_ATTEMPTS {
        if backend_terminated.load(Ordering::Relaxed) {
            return false;
        }

        for port in HEALTH_PORTS {
            if check_backend_health(port) {
                write_diagnostic_log(
                    app_handle,
                    &format!("health check passed on http://127.0.0.1:{port}/health"),
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
    if stream
        .take(MAX_HEALTH_RESPONSE_BYTES)
        .read_to_string(&mut response)
        .is_err()
    {
        return false;
    }

    is_healthy_response(&response)
}

fn is_healthy_response(response: &str) -> bool {
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

    body.get("status").and_then(|status| status.as_str()) == Some("ok")
}

#[cfg(test)]
mod tests {
    use super::is_healthy_response;

    #[test]
    fn accepts_200_response_with_ok_json_status() {
        assert!(is_healthy_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\"}"
        ));
        assert!(is_healthy_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\",\"version\":\"1.0\",\"pid\":123}"
        ));
    }

    #[test]
    fn rejects_non_200_response_even_when_body_is_ok() {
        assert!(!is_healthy_response(
            "HTTP/1.1 500 Internal Server Error\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\"}"
        ));
        assert!(!is_healthy_response(
            "HTTP/1.1 404 Not Found\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\"}"
        ));
        assert!(!is_healthy_response(
            "HTTP/1.1 201 Created\r\nContent-Type: application/json\r\n\r\n{\"status\":\"ok\"}"
        ));
    }

    #[test]
    fn rejects_200_response_with_unhealthy_status() {
        assert!(!is_healthy_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"starting\"}"
        ));
    }

    #[test]
    fn rejects_200_response_with_missing_status_field() {
        assert!(!is_healthy_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"healthy\":true}"
        ));
    }

    #[test]
    fn rejects_200_response_with_non_string_status() {
        assert!(!is_healthy_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":true}"
        ));
        assert!(!is_healthy_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":null}"
        ));
    }

    #[test]
    fn rejects_200_response_with_invalid_json() {
        assert!(!is_healthy_response(
            "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\nnot-json"
        ));
    }

    #[test]
    fn rejects_200_response_with_empty_body() {
        assert!(!is_healthy_response("HTTP/1.1 200 OK\r\n\r\n"));
    }

    #[test]
    fn rejects_malformed_http_response() {
        assert!(!is_healthy_response("{\"status\":\"ok\"}"));
    }
}
