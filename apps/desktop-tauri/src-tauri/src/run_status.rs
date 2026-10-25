//! Run status messages from the backend sidecar.
//!
//! The backend, started with `TAGCHECK_STATUS_STDOUT=1`, writes one stdout
//! line per change of its run status: `TAGCHECK_STATUS ` followed by compact
//! JSON (`RunStatusMessage` in libs/utils). This module parses those lines,
//! shows the status in the tray (tooltip and the menu's status item) and
//! sends a system notification when a batch, or a single run the user is
//! not watching, finishes.

use serde::Deserialize;
use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::{diagnostics::write_diagnostic_log, tray::show_tray_status, window::MAIN_WINDOW_LABEL};

/// The start of every status line.
pub(crate) const STATUS_LINE_PREFIX: &str = "TAGCHECK_STATUS ";

/// The environment variable that asks the backend for status lines.
pub(crate) const STATUS_STDOUT_ENV: &str = "TAGCHECK_STATUS_STDOUT";

/// The tooltip while no test runs.
pub(crate) const IDLE_TEXT: &str = "Tag Check keeps running in the tray";

/// Windows keeps at most 127 UTF-16 units of a tray tooltip (`szTip`, with
/// its terminating null); tray-icon cuts a longer one without a null.
pub(crate) const MAX_TOOLTIP_UTF16: usize = 127;

const TITLE_PREFIX: &str = "Tag Check \u{2014} ";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum BatchSource {
    Manual,
    Schedule,
    /// A source this build does not know; shown as a manual batch.
    #[serde(other)]
    Other,
}

/// Where a run sits in its batch.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BatchPlace {
    pub batch_id: u64,
    /// 1-based.
    pub position: u32,
    pub total: u32,
    pub source: BatchSource,
}

/// The test a run replays.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RunTest {
    pub project_slug: String,
    pub event_id: String,
    #[serde(default)]
    pub event_name: String,
    #[serde(default)]
    pub test_name: String,
    #[serde(default)]
    pub batch: Option<BatchPlace>,
}

/// The backend's run status (`runStatus`).
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(tag = "state", rename_all = "camelCase")]
pub(crate) enum RunStatus {
    Idle,
    Starting(RunTest),
    #[serde(rename_all = "camelCase")]
    Running {
        current_step: u32,
        total_steps: u32,
        #[serde(flatten)]
        test: RunTest,
    },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum RunOutcome {
    Passed,
    Partial,
    Failed,
    Error,
    Cancelled,
}

/// A run that ended (`runFinished`).
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RunFinished {
    #[serde(flatten)]
    pub test: RunTest,
    pub status: RunOutcome,
    #[serde(default)]
    pub message: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) enum BatchEnd {
    Completed,
    Cancelled,
}

/// A batch that ended (`batchFinished`).
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BatchFinished {
    pub batch_id: u64,
    pub project_slug: String,
    pub source: BatchSource,
    pub status: BatchEnd,
    pub total: u32,
    pub passed: u32,
    pub partial: u32,
    pub failed: u32,
    pub error: u32,
    pub cancelled: u32,
}

/// One status line's message.
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "camelCase")]
pub(crate) enum StatusMessage {
    RunStatus(RunStatus),
    RunFinished(RunFinished),
    BatchFinished(BatchFinished),
}

/// Reads a stdout line: `None` when it is not a status line, otherwise the
/// message or why it could not be read.
pub(crate) fn parse_status_line(line: &str) -> Option<Result<StatusMessage, serde_json::Error>> {
    let json = line.trim().strip_prefix(STATUS_LINE_PREFIX)?;
    Some(serde_json::from_str(json))
}

/// The name a test is shown by: its GA4 event name, else its test name,
/// else its eventId.
fn test_label(test: &RunTest) -> &str {
    [&test.event_name, &test.test_name, &test.event_id]
        .into_iter()
        .map(|name| name.trim())
        .find(|name| !name.is_empty())
        .unwrap_or("a test")
}

fn batch_suffix(batch: Option<&BatchPlace>) -> String {
    match batch {
        None => String::new(),
        Some(place) => {
            let kind = if place.source == BatchSource::Schedule {
                "scheduled batch"
            } else {
                "batch"
            };
            format!(" \u{b7} {kind} {}/{}", place.position, place.total)
        }
    }
}

/// The status as one line, untruncated: "Tag Check — add_to_cart · step
/// 5/12 · batch 1/2".
pub(crate) fn status_text(status: &RunStatus) -> String {
    match status {
        RunStatus::Idle => IDLE_TEXT.to_string(),
        RunStatus::Starting(test) => format!(
            "{TITLE_PREFIX}starting {}{}",
            test_label(test),
            batch_suffix(test.batch.as_ref())
        ),
        RunStatus::Running {
            current_step,
            total_steps,
            test,
        } => format!(
            "{TITLE_PREFIX}{} \u{b7} step {current_step}/{total_steps}{}",
            test_label(test),
            batch_suffix(test.batch.as_ref())
        ),
    }
}

/// Cuts `text` to at most `max_utf16` UTF-16 units, on a char boundary,
/// ending a cut text with "…".
pub(crate) fn truncate_utf16(text: &str, max_utf16: usize) -> String {
    if text.encode_utf16().count() <= max_utf16 {
        return text.to_string();
    }
    let budget = max_utf16.saturating_sub(1);
    let mut used = 0;
    let mut cut = String::new();
    for character in text.chars() {
        used += character.len_utf16();
        if used > budget {
            break;
        }
        cut.push(character);
    }
    if max_utf16 > 0 {
        cut.push('\u{2026}');
    }
    cut
}

/// The tray tooltip of a status, within the Windows limit.
pub(crate) fn tooltip_text(status: &RunStatus) -> String {
    truncate_utf16(&status_text(status), MAX_TOOLTIP_UTF16)
}

/// A menu item's text: `&` marks a mnemonic in tray menus, so a literal one
/// is doubled.
pub(crate) fn menu_label(text: &str) -> String {
    text.replace('&', "&&")
}

/// The notification of a finished batch: its title and body.
pub(crate) fn batch_notification(batch: &BatchFinished) -> (String, String) {
    let title = if batch.source == BatchSource::Schedule {
        format!("{TITLE_PREFIX}scheduled batch finished")
    } else {
        format!("{TITLE_PREFIX}batch finished")
    };
    let counts: Vec<String> = [
        (batch.passed, "passed"),
        (batch.partial, "partial"),
        (batch.failed, "failed"),
        (batch.error, "could not run"),
    ]
    .into_iter()
    .filter(|(count, _)| *count > 0)
    .map(|(count, label)| format!("{count} {label}"))
    .collect();
    let body = match batch.status {
        BatchEnd::Cancelled => {
            let done = batch.total.saturating_sub(batch.cancelled);
            let cancelled = format!("Cancelled after {done} of {}", batch.total);
            if counts.is_empty() {
                cancelled
            } else {
                format!("{cancelled}: {}", counts.join(", "))
            }
        }
        BatchEnd::Completed if batch.total > 0 && batch.passed == batch.total => {
            format!("{} of {} passed", batch.passed, batch.total)
        }
        BatchEnd::Completed if counts.is_empty() => "No test ran".to_string(),
        BatchEnd::Completed => counts.join(", "),
    };
    (title, body)
}

/// The notification of a finished single run, or `None` for a run of a
/// batch (the batch notifies once, when it ends) and for a cancelled run
/// (the user stopped it).
pub(crate) fn run_notification(run: &RunFinished) -> Option<(String, String)> {
    if run.test.batch.is_some() {
        return None;
    }
    let name = test_label(&run.test);
    let body = match run.status {
        RunOutcome::Passed => format!("{name} passed"),
        RunOutcome::Partial => format!("{name} partially passed"),
        RunOutcome::Failed => format!("{name} failed"),
        RunOutcome::Error => match run.message.as_deref().map(str::trim) {
            Some(reason) if !reason.is_empty() => {
                format!("{name} could not run: {}", truncate_utf16(reason, 200))
            }
            _ => format!("{name} could not run"),
        },
        RunOutcome::Cancelled => return None,
    };
    Some((format!("{TITLE_PREFIX}test finished"), body))
}

/// A single run notifies only when the user is not looking at the main
/// window: it is hidden (in the tray), minimized or not focused.
pub(crate) fn window_unattended(visible: bool, minimized: bool, focused: bool) -> bool {
    !visible || minimized || !focused
}

fn main_window_unattended(app_handle: &AppHandle) -> bool {
    let Some(window) = app_handle.get_webview_window(MAIN_WINDOW_LABEL) else {
        return true;
    };
    window_unattended(
        window.is_visible().unwrap_or(false),
        window.is_minimized().unwrap_or(false),
        window.is_focused().unwrap_or(false),
    )
}

fn notify(app_handle: &AppHandle, title: &str, body: &str) {
    if let Err(error) = app_handle
        .notification()
        .builder()
        .title(title)
        .body(body)
        .show()
    {
        write_diagnostic_log(
            app_handle,
            &format!("notification: failed to show: {error}"),
        );
    }
}

/// Shows a status message: the run status in the tray, and a notification
/// for a finished batch or an unattended single run.
pub(crate) fn handle_status_message(app_handle: &AppHandle, message: StatusMessage) {
    match message {
        StatusMessage::RunStatus(status) => show_tray_status(app_handle, &tooltip_text(&status)),
        StatusMessage::RunFinished(run) => {
            if let Some((title, body)) = run_notification(&run) {
                if main_window_unattended(app_handle) {
                    notify(app_handle, &title, &body);
                }
            }
        }
        StatusMessage::BatchFinished(batch) => {
            let (title, body) = batch_notification(&batch);
            write_diagnostic_log(
                app_handle,
                &format!("notification: batch {} finished", batch.batch_id),
            );
            notify(app_handle, &title, &body);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test(event_name: &str, batch: Option<BatchPlace>) -> RunTest {
        RunTest {
            project_slug: "shop".into(),
            event_id: "evt-1".into(),
            event_name: event_name.into(),
            test_name: "Add to cart".into(),
            batch,
        }
    }

    fn place(position: u32, total: u32, source: BatchSource) -> BatchPlace {
        BatchPlace {
            batch_id: 4,
            position,
            total,
            source,
        }
    }

    fn batch(status: BatchEnd, counts: [u32; 5], source: BatchSource) -> BatchFinished {
        BatchFinished {
            batch_id: 4,
            project_slug: "shop".into(),
            source,
            status,
            total: counts.iter().sum(),
            passed: counts[0],
            partial: counts[1],
            failed: counts[2],
            error: counts[3],
            cancelled: counts[4],
        }
    }

    #[test]
    fn ignores_lines_that_are_not_status_lines() {
        assert!(parse_status_line("[Nest] 1234 - LOG Running").is_none());
        assert!(parse_status_line("TAGCHECK_STATUSES {}").is_none());
        assert!(parse_status_line("").is_none());
    }

    #[test]
    fn reports_a_malformed_status_line() {
        assert!(matches!(
            parse_status_line("TAGCHECK_STATUS {not json"),
            Some(Err(_))
        ));
        assert!(matches!(
            parse_status_line(r#"TAGCHECK_STATUS {"type":"unknown","data":{}}"#),
            Some(Err(_))
        ));
    }

    #[test]
    fn parses_every_run_status() {
        let idle = parse_status_line(
            "TAGCHECK_STATUS {\"type\":\"runStatus\",\"data\":{\"state\":\"idle\"}}\r\n",
        );
        assert_eq!(
            idle.map(Result::ok),
            Some(Some(StatusMessage::RunStatus(RunStatus::Idle)))
        );

        let starting = parse_status_line(
            r#"TAGCHECK_STATUS {"type":"runStatus","data":{"state":"starting","projectSlug":"shop","eventId":"evt-1","eventName":"add_to_cart","testName":"Add to cart"}}"#,
        );
        assert_eq!(
            starting.map(Result::ok),
            Some(Some(StatusMessage::RunStatus(RunStatus::Starting(test(
                "add_to_cart",
                None
            )))))
        );

        let running = parse_status_line(
            r#"TAGCHECK_STATUS {"type":"runStatus","data":{"state":"running","projectSlug":"shop","eventId":"evt-1","eventName":"add_to_cart","testName":"Add to cart","currentStep":5,"totalSteps":12,"batch":{"batchId":4,"position":1,"total":2,"source":"schedule"}}}"#,
        );
        assert_eq!(
            running.map(Result::ok),
            Some(Some(StatusMessage::RunStatus(RunStatus::Running {
                current_step: 5,
                total_steps: 12,
                test: test("add_to_cart", Some(place(1, 2, BatchSource::Schedule))),
            })))
        );
    }

    #[test]
    fn parses_finished_runs_and_batches() {
        let run = parse_status_line(
            r#"TAGCHECK_STATUS {"type":"runFinished","data":{"projectSlug":"shop","eventId":"evt-1","eventName":"add_to_cart","testName":"Add to cart","status":"error","message":"net::ERR"}}"#,
        );
        assert_eq!(
            run.map(Result::ok),
            Some(Some(StatusMessage::RunFinished(RunFinished {
                test: test("add_to_cart", None),
                status: RunOutcome::Error,
                message: Some("net::ERR".into()),
            })))
        );

        let finished = parse_status_line(
            r#"TAGCHECK_STATUS {"type":"batchFinished","data":{"batchId":4,"projectSlug":"shop","source":"manual","status":"cancelled","total":3,"passed":1,"partial":0,"failed":0,"error":0,"cancelled":2}}"#,
        );
        assert_eq!(
            finished.map(Result::ok),
            Some(Some(StatusMessage::BatchFinished(batch(
                BatchEnd::Cancelled,
                [1, 0, 0, 0, 2],
                BatchSource::Manual
            ))))
        );
    }

    #[test]
    fn reads_an_unknown_batch_source_as_other() {
        let place: BatchPlace =
            serde_json::from_str(r#"{"batchId":1,"position":1,"total":1,"source":"api"}"#)
                .expect("place");
        assert_eq!(place.source, BatchSource::Other);
    }

    #[test]
    fn formats_the_idle_status() {
        assert_eq!(status_text(&RunStatus::Idle), IDLE_TEXT);
    }

    #[test]
    fn formats_a_starting_run() {
        assert_eq!(
            status_text(&RunStatus::Starting(test("add_to_cart", None))),
            "Tag Check \u{2014} starting add_to_cart"
        );
    }

    #[test]
    fn formats_a_single_run_without_a_batch() {
        let status = RunStatus::Running {
            current_step: 5,
            total_steps: 12,
            test: test("add_to_cart", None),
        };
        assert_eq!(
            status_text(&status),
            "Tag Check \u{2014} add_to_cart \u{b7} step 5/12"
        );
    }

    #[test]
    fn formats_a_manual_and_a_scheduled_batch() {
        let manual = RunStatus::Running {
            current_step: 5,
            total_steps: 12,
            test: test("add_to_cart", Some(place(1, 2, BatchSource::Manual))),
        };
        assert_eq!(
            status_text(&manual),
            "Tag Check \u{2014} add_to_cart \u{b7} step 5/12 \u{b7} batch 1/2"
        );
        let scheduled =
            RunStatus::Starting(test("purchase", Some(place(2, 2, BatchSource::Schedule))));
        assert_eq!(
            status_text(&scheduled),
            "Tag Check \u{2014} starting purchase \u{b7} scheduled batch 2/2"
        );
    }

    #[test]
    fn names_a_test_without_an_event_name_by_its_test_name() {
        assert_eq!(
            status_text(&RunStatus::Starting(test("  ", None))),
            "Tag Check \u{2014} starting Add to cart"
        );
    }

    #[test]
    fn keeps_a_short_text() {
        assert_eq!(truncate_utf16("short", 127), "short");
        let exact = "a".repeat(127);
        assert_eq!(truncate_utf16(&exact, 127), exact);
    }

    #[test]
    fn truncates_a_long_text_to_the_limit_with_an_ellipsis() {
        let cut = truncate_utf16(&"a".repeat(300), 127);
        assert_eq!(cut.encode_utf16().count(), 127);
        assert!(cut.ends_with('\u{2026}'));
    }

    #[test]
    fn truncates_on_char_boundaries_counting_utf16_units() {
        // Each emoji is two UTF-16 units and four UTF-8 bytes.
        let cut = truncate_utf16(&"\u{1F600}".repeat(100), 127);
        assert!(cut.encode_utf16().count() <= 127);
        assert_eq!(cut.chars().filter(|c| *c == '\u{1F600}').count(), 63);
        let accented = truncate_utf16(&"\u{e9}".repeat(200), 10);
        assert_eq!(accented, format!("{}\u{2026}", "\u{e9}".repeat(9)));
        assert_eq!(truncate_utf16("abc", 0), "");
    }

    #[test]
    fn keeps_a_long_tooltip_within_the_windows_limit() {
        let status = RunStatus::Running {
            current_step: 1,
            total_steps: 2,
            test: test(
                &"very_long_event_name_".repeat(10),
                Some(place(1, 2, BatchSource::Schedule)),
            ),
        };
        let tooltip = tooltip_text(&status);
        assert!(tooltip.encode_utf16().count() <= MAX_TOOLTIP_UTF16);
        assert!(tooltip.starts_with("Tag Check \u{2014} very_long_event_name_"));
    }

    #[test]
    fn escapes_ampersands_in_menu_labels() {
        assert_eq!(
            menu_label("Tag Check \u{2014} add & remove"),
            "Tag Check \u{2014} add && remove"
        );
    }

    #[test]
    fn notifies_a_batch_that_all_passed() {
        let (title, body) = batch_notification(&batch(
            BatchEnd::Completed,
            [2, 0, 0, 0, 0],
            BatchSource::Manual,
        ));
        assert_eq!(title, "Tag Check \u{2014} batch finished");
        assert_eq!(body, "2 of 2 passed");
    }

    #[test]
    fn notifies_a_scheduled_batch_with_mixed_results() {
        let (title, body) = batch_notification(&batch(
            BatchEnd::Completed,
            [1, 1, 1, 1, 0],
            BatchSource::Schedule,
        ));
        assert_eq!(title, "Tag Check \u{2014} scheduled batch finished");
        assert_eq!(body, "1 passed, 1 partial, 1 failed, 1 could not run");
        let (_, body) = batch_notification(&batch(
            BatchEnd::Completed,
            [1, 0, 1, 0, 0],
            BatchSource::Manual,
        ));
        assert_eq!(body, "1 passed, 1 failed");
    }

    #[test]
    fn notifies_a_cancelled_batch() {
        let (_, body) = batch_notification(&batch(
            BatchEnd::Cancelled,
            [1, 0, 0, 0, 2],
            BatchSource::Manual,
        ));
        assert_eq!(body, "Cancelled after 1 of 3: 1 passed");
        let (_, body) = batch_notification(&batch(
            BatchEnd::Cancelled,
            [0, 0, 0, 0, 3],
            BatchSource::Manual,
        ));
        assert_eq!(body, "Cancelled after 0 of 3");
    }

    #[test]
    fn notifies_a_finished_single_run() {
        let finished = |status, message: Option<&str>| RunFinished {
            test: test("add_to_cart", None),
            status,
            message: message.map(str::to_string),
        };
        let body = |run: RunFinished| run_notification(&run).map(|(_, body)| body);
        assert_eq!(
            run_notification(&finished(RunOutcome::Passed, None)),
            Some((
                "Tag Check \u{2014} test finished".to_string(),
                "add_to_cart passed".to_string()
            ))
        );
        assert_eq!(
            body(finished(RunOutcome::Partial, None)).as_deref(),
            Some("add_to_cart partially passed")
        );
        assert_eq!(
            body(finished(RunOutcome::Failed, None)).as_deref(),
            Some("add_to_cart failed")
        );
        assert_eq!(
            body(finished(
                RunOutcome::Error,
                Some("net::ERR_NAME_NOT_RESOLVED")
            ))
            .as_deref(),
            Some("add_to_cart could not run: net::ERR_NAME_NOT_RESOLVED")
        );
        assert_eq!(
            body(finished(RunOutcome::Error, None)).as_deref(),
            Some("add_to_cart could not run")
        );
        assert_eq!(body(finished(RunOutcome::Cancelled, None)), None);
    }

    #[test]
    fn never_notifies_a_run_of_a_batch() {
        let run = RunFinished {
            test: test("add_to_cart", Some(place(1, 2, BatchSource::Manual))),
            status: RunOutcome::Failed,
            message: None,
        };
        assert_eq!(run_notification(&run), None);
    }

    #[test]
    fn notifies_a_single_run_only_when_the_window_is_unattended() {
        assert!(!window_unattended(true, false, true));
        assert!(window_unattended(false, false, false));
        assert!(window_unattended(true, true, false));
        assert!(window_unattended(true, false, false));
    }
}
