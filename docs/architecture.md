# Capter Architecture Iterations

This document outlines the three major architectural approaches we iterated through while building the terminal session capturer. The core challenge across all iterations was accurately associating a terminal command with its exact corresponding output chunk, while preserving raw ANSI styling for later visual rendering.

## Architecture 1: Prompt Hook + File IPC (The Initial Attempt)

**How it worked:**
- PowerShell used its built-in `prompt` function to write the last executed command's text and path to a temporary text file (`CAPTER_CMD_FILE`).
- The Node.js parent process (`shell.js`) watched this file using `fs.watchFile`.
- When the file updated, Node assigned the accumulated terminal output to the new command.

**Pros:**
- Conceptually simple.
- Kept the PTY data stream completely clean (no injected markers).

**Cons (Why it failed):**
- **The Off-By-One Timing Issue:** `fs.watchFile` in Node has an inherent polling delay (~100ms). The output from the PTY pipe is instantaneous. Because of this, Node would receive a command's output *before* it detected that the command was written to the file. This caused output to be assigned to the *previous* command in the history array.


## Architecture 2: Pre-Execution Hook + Synchronous File Read

**How it worked:**
- To fix the timing issue, we switched to PowerShell's `PSReadLine` module, specifically the `AddToHistoryHandler`. This allowed us to write the command to the temp file *before* the command executed.
- In Node, we removed `fs.watchFile` and instead ran a synchronous `fs.readFileSync` during every single `shell.onData` event to check if a new command had been registered.

**Pros:**
- Solved the off-by-one timing issue. The command was guaranteed to be in the file before the PTY output arrived.

**Cons (Why it failed):**
- **ID Inflation:** `AddToHistoryHandler` triggers when PSReadLine loads its persistent history file. This caused thousands of old commands from previous terminal sessions to be loaded at startup, inflating the ID counter to 6000+.
- **Data Batching Misalignment:** If commands executed rapidly, ConPTY would batch the output of multiple commands into a single `shell.onData` chunk. The synchronous file check would assign all output in that massive chunk to the first detected command, leaving the subsequent commands empty.


## Architecture 3: In-Stream Invisible Markers (Current & Final)

**How it worked:**
- We eliminated the temporary file (IPC) completely.
- We reverted to the PowerShell `prompt` function.
- When a command finishes, PowerShell takes the command path and text, **Base64 encodes it**, and emits it directly into the terminal output stream using an invisible OSC 1337 escape sequence: `\x1B]1337;Custom=CapterMarker:BASE64_STRING\x07`.
- `shell.js` intercepts the incoming PTY data, runs a Regex to find the marker, splits the string perfectly at that boundary, and then **strips the marker out** before writing to the actual terminal view.

**Pros:**
- **Flawless Synchronization:** Because the marker travels through the exact same PTY pipe as the output data, it is mathematically impossible for the command and output to get out of sync.
- **Solves Data Batching:** If ConPTY batches multiple commands into one chunk, the invisible markers are perfectly interleaved between the outputs inside that chunk. The Regex accurately splits them into perfect segments.
- **Perfect Visual Fidelity:** By extracting the exact string chunk before the marker, 100% of the raw ANSI escape sequences, colors, and cursor movements are preserved. This allows for an exact visual reconstruction of the terminal state (prompt + typed command + result) during later image generation.
- **No Side Effects:** Base64 encoding ensures that special characters in the command don't accidentally break terminal formatting, and stripping the marker ensures the user's live terminal experiences no flickering or visual artifacts.

**Cons:**
- Requires mild string processing (Regex) overhead in the Node stream, though this is negligible for performance.
