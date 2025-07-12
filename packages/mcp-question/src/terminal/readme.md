# Terminal Spawning Rationale

## Context

On macOS we cannot spawn a Node.js process inside the same Terminal window with a simple `child_process.spawn(...)`.
Instead, we must launch **Terminal.app** via AppleScript (OSA script) and then run the command. This extra indirection
removes the usual ability to:

- Communicate over Node’s built-in IPC channels.
- Receive the child PID and listen for `exit` / `close` events.

Consequently, we cannot detect when the user closes the Terminal or when the process exits unexpectedly.

## Challenges

1. **No direct IPC** – bidirectional communication is unavailable by default.
2. **No reliable PID** – the parent process lacks a handle to monitor lifecycle events.
3. **User interruption** – the user may close the Terminal at any time, and we must react gracefully.

## Solution: Heartbeat + JSON Files

To restore communication and monitoring we use the file system as an ad-hoc transport layer:

| File            | Direction      | Purpose                                     |
| --------------- | -------------- | ------------------------------------------- |
| `input.json`    | parent → child | Delivers questionnaire payload.             |
| `output.json`   | child → parent | Returns user responses.                     |
| `heartbeat.txt` | child → parent | Updated with a timestamp every few seconds. |

The parent process polls `heartbeat.txt`:

- If the timestamp stops changing for a configured threshold, **or**
- If the file is deleted,

it assumes the Terminal was closed or the child crashed and aborts the questionnaire.

## Trade-offs

- Slightly higher latency due to file polling.
- Temporary files can be left behind on hard crashes, though normal code paths clean them up.
- Works uniformly across macOS versions without requiring privileged entitlements.

---

This document explains the reasoning behind the custom terminal-spawning strategy used in `@ver0/mcp-question`.🚀
