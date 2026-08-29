# Capter Architecture Evolution (Start to Finish)

## 1. Project Goal
Capter is a reusable terminal-capture npm package.
Its purpose is to capture terminal activity and later represent commands and their output visually, using indexes/IDs to locate and associate individual command sections.
The desired stored record is:
```js
{
    id,
    path,
    command,
    output
}
```
Where:
* `id` = unique reference for the command
* `path` = directory where the command was executed
* `command` = command entered before pressing Enter
* `output` = raw terminal output produced by that execution

**Raw output is intentionally preserved** because it can contain ANSI color/control information that may later be interpreted when generating terminal images. Do not destroy information during capture.

---

## 2. Initial Architecture: PTY + Terminal Capture
The initial shell architecture used `node-pty`:
```text
User → stdin → node-pty / PowerShell → stdout / PTY data → Capter
```
The PTY data was captured in `capData`, representing the raw terminal/session capture, and written to a file for inspection using a capture writer.

---

## 3. First Command Detection: PowerShell Prompt + Get-History
The first command-detection approach modified the PowerShell prompt function to print a visible `Write-Host` message with the command text. 
This successfully identified commands using PowerShell's history, but the detected command text was visibly mixed with terminal output and PTY control sequences.

---

## 4. Problem Discovered: Command/Output Mismatch
The major problem was that commands and outputs were not reliably associated (e.g., Command 1 → Output 2).
This happened because PTY data arrives in chunks and timing/arrival order cannot safely be used as the identity of an execution. A command could execute quickly while another piece of PTY data arrived later. 

---

## 5. Command Queue
A `history.js` module was introduced to maintain a bounded command queue (`MAX_COMMANDS = 20`) with an incrementing ID (`nextCommandId++`). This ID became important as the reference used to locate a specific command.

---

## 6. Failed Approach: Terminal Command Visible Markers
We introduced visible terminal markers (`__CAPTER_CMD_START__`).
Although command detection worked, injecting physical text markers into the PTY stream severely affected terminal rendering and input formatting (garbled text, large spacing, cursor problems).
> **Conclusion:** Visible terminal-injected command markers were abandoned.

---

## 7. Separate Command Communication Channel (File IPC)
The next architecture used a temporary file (`CAPTER_CMD_FILE`) as an internal communication channel. PowerShell wrote the command history to the file, and Node.js read it. This approach successfully avoided interfering with typing/rendering.

---

## 8 & 9. PowerShell Hook Using Get-History
The PowerShell hook used `$lastCmd = Get-History -Count 1` inside the `prompt` function, keeping track of the last processed ID to avoid duplicates. It wrote `path|command` to the temporary file.

---

## 10, 11, 12. Model Refinement
* The history model was simplified strictly to `{id, path, command, output}`.
* A separate `parser.js` was deemed unnecessary because PowerShell knows the command via `Get-History` and Node receives the stream via `node-pty`.
* A strict rule was established: **Preserve Raw Output**. ANSI sequences (like `\x1B[38;5;9m`) must be kept completely intact for later image rendering.

---

## 13 & 14. The Output-Association Timing Problem
While the separate file successfully detected *commands*, it completely failed at defining the **raw output boundary**.
Because the file update and the PTY stream update are asynchronous, Node would receive the output of `pwd` while the file still hadn't updated. This caused outputs to shift and assign themselves to the wrong commands.

> **Crucial Insight:** The command file gives command identity, but a side-channel file can NEVER guarantee perfect synchronization with a data stream due to chunk batching. We needed a reliable execution boundary directly inside the raw PTY output.

---

## 15 & 16. The Breakthrough: In-Stream Invisible Markers (OSC 1337)
To achieve perfect synchronization without breaking the visual terminal, we eliminated the temporary file entirely and introduced **Invisible OSC (Operating System Command) Markers**.

Instead of writing to a file, the PowerShell `prompt` function takes the command and path, **Base64 encodes them**, and emits an invisible control sequence directly into the terminal stream:
```powershell
\x1B]1337;Custom=CapterMarker:BASE64_STRING\x07
```

**Why this works flawlessly:**
1. **Perfect Timing:** Because the marker travels through the *exact same PTY pipe* as the output data, it is mathematically impossible for the command metadata and the raw output to get out of sync.
2. **Batching Solved:** If `node-pty` batches the output of three fast commands into a single chunk, the invisible markers are still perfectly interleaved between the outputs inside that string chunk.
3. **Completely Invisible:** Modern terminals recognize `\x1B]1337` as a background control sequence and silently swallow it. It does not cause the cursor glitches or visual artifacts that the text markers from Phase 6 caused.

---

## 17. Final Architecture

```text
                   ┌─────────────────────┐
                   │     PowerShell      │
                   │                     │
                   │  Get-History        │
                   └─────────┬───────────┘
                             │
                    Base64(path|command)
                             │
                             ▼
                    In-Stream OSC Marker
                  \x1B]1337;Custom=...
                             │
                             ▼
                         shell.js
                   (Regex splits chunks)
                             │
                             ▼
                    ┌─────────────────┐
                    │  Raw PTY chunk  │
                    │                 │
                    │ command output  │
                    │ ANSI formatting │
                    └────────┬────────┘
                             │
                             ▼
                       history.js
                             │
                             ▼
                  { id, path, command, output }
```

## 18. Conclusion & Current Standing
We successfully achieved the perfect capture architecture. By using an in-stream, Base64-encoded, invisible OSC marker, we completely solved the timing/batching mismatch issues of File IPC while preserving 100% of the raw ANSI formatting (colors, cursor movements, typing visual echo) required to generate accurate terminal session images later.

The capture layer is now stable, robust, and ready for the image-generation phase.
