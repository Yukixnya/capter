# Capter Architecture Evolution (Start to Finish)

## 1. Project Goal

Capter is a reusable terminal-capture npm package.

Its purpose is to capture terminal activity and later represent commands
and their output visually, using indexes/IDs to locate and associate
individual command sections.

The desired stored record is:

``` js
{
    id,
    path,
    command,
    output
}
```

Where:

-   `id` = unique reference for the command
-   `path` = directory where the command was executed
-   `command` = command entered before pressing Enter
-   `output` = raw terminal output produced by that execution

**Raw output is intentionally preserved** because it can contain ANSI
color/control information that may later be interpreted when generating
terminal images. Do not destroy information during capture.

------------------------------------------------------------------------

## 2. Initial Architecture: PTY + Terminal Capture

The initial shell architecture used `node-pty`:

``` text
User → stdin → node-pty / PowerShell → stdout / PTY data → Capter
```

The PTY data was captured in `capData`, representing the raw
terminal/session capture, and written to a file for inspection using a
capture writer.

------------------------------------------------------------------------

## 3. First Command Detection: PowerShell Prompt + Get-History

The first command-detection approach modified the PowerShell prompt
function to print a visible `Write-Host` message with the command text.

This successfully identified commands using PowerShell's history, but
the detected command text was visibly mixed with terminal output and PTY
control sequences.

------------------------------------------------------------------------

## 4. Problem Discovered: Command/Output Mismatch

The major problem was that commands and outputs were not reliably
associated (e.g., Command 1 → Output 2).

This happened because PTY data arrives in chunks and timing/arrival
order cannot safely be used as the identity of an execution. A command
could execute quickly while another piece of PTY data arrived later.

------------------------------------------------------------------------

## 5. Command Queue

A `history.js` module was introduced to maintain a bounded command queue
(`MAX_COMMANDS = 20`) with an incrementing ID (`nextCommandId++`).

This ID became important as the reference used to locate a specific
command.

------------------------------------------------------------------------

## 6. Failed Approach: Terminal Command Visible Markers

We introduced visible terminal markers (`__CAPTER_CMD_START__`).

Although command detection worked, injecting physical text markers into
the PTY stream severely affected terminal rendering and input formatting
(garbled text, large spacing, cursor problems).

> **Conclusion:** Visible terminal-injected command markers were
> abandoned.

------------------------------------------------------------------------

## 7. Separate Command Communication Channel (File IPC)

The next architecture used a temporary file (`CAPTER_CMD_FILE`) as an
internal communication channel.

PowerShell wrote the command history to the file, and Node.js read it.

This approach successfully avoided interfering with typing/rendering.

------------------------------------------------------------------------

## 8 & 9. PowerShell Hook Using Get-History

The PowerShell hook used:

``` powershell
$lastCmd = Get-History -Count 1
```

inside the `prompt` function, keeping track of the last processed ID to
avoid duplicates.

It wrote:

``` text
path|command
```

to the temporary file.

------------------------------------------------------------------------

## 10, 11, 12. Model Refinement

-   The history model was simplified strictly to
    `{id, path, command, output}`.
-   A separate `parser.js` was initially deemed unnecessary because
    PowerShell knows the command via `Get-History` and Node receives the
    stream via `node-pty`.
-   A strict rule was established: **Preserve Raw Output**.

ANSI sequences such as:

``` text
\x1B[38;5;9m
```

must be kept completely intact for later image rendering.

------------------------------------------------------------------------

## 13 & 14. The Output-Association Timing Problem

While the separate file successfully detected **commands**, it
completely failed at defining the **raw output boundary**.

Because the file update and the PTY stream update are asynchronous, Node
could receive the output of `pwd` while the file had not yet updated.

This caused outputs to shift and assign themselves to the wrong
commands.

> **Crucial Insight:** The command file gives command identity, but a
> side-channel file cannot guarantee perfect synchronization with a data
> stream due to chunk batching. We needed a reliable execution boundary
> directly inside the raw PTY output.

------------------------------------------------------------------------

## 15 & 16. The Breakthrough: In-Stream Invisible Markers (OSC 1337)

To achieve synchronization without breaking the visual terminal, we
eliminated the temporary file and introduced **Invisible OSC (Operating
System Command) Markers**.

Instead of writing to a file, the PowerShell `prompt` function takes the
command and path, Base64 encodes them, and emits an invisible control
sequence directly into the terminal stream:

``` powershell
\x1B]1337;Custom=CapterMarker\:BASE64_STRING\x07
```

### Why this works

1.  **Same stream:** Command metadata and terminal output travel through
    the same PTY stream.
2.  **Chunking resistant:** If `node-pty` batches multiple commands into
    one data event, the markers remain interleaved at their positions in
    the same string.
3.  **Invisible:** The marker is a terminal control sequence rather than
    visible text, so it does not intentionally add characters to the
    displayed terminal.

------------------------------------------------------------------------

## 17. Marker Parsing in `shell.js`

`shell.js` was changed to search the accumulated PTY buffer for the
custom marker.

The marker contains Base64 data which is decoded back into:

``` text
path|command
```

The raw chunk before the marker is treated as the terminal data
associated with that command boundary.

Conceptually:

``` text
outputBuffer
    ↓
find Capter marker
    ↓
decode Base64
    ↓
extract path + command
    ↓
take raw chunk before marker
    ↓
associate chunk with command
```

An `isFirstTime` flag was also introduced to ignore the startup
hook/dot-sourcing event so that the hook itself would not appear as a
normal user command.

------------------------------------------------------------------------

## 18. Capture Layer Validation

The new marker architecture was tested with multiple commands,
including:

``` powershell
echo "hello"
pwd
nks
jnks
```

The important result was that command IDs and their corresponding output
sections were no longer randomly shifted based on arrival timing.

This established the capture layer as a working prototype.

------------------------------------------------------------------------

# 19. New Requirement: Recreate the Terminal Visually

Once command/output association was stable, the next requirement became:

> Do not merely store readable text. Recreate the terminal visually,
> including colors, cursor movement, spacing, and redraw behavior.

This changed the problem from:

``` text
raw PTY → readable text
```

to:

``` text
raw PTY → virtual terminal screen → image
```

The raw stream contains much more than command output. It contains
terminal instructions such as:

``` text
colors
cursor movement
cursor visibility
backspace
carriage return
line clearing
redrawing
```

Therefore, simply stripping ANSI codes would lose information required
for an accurate terminal image.

------------------------------------------------------------------------

## 20. Decision: Build a Terminal Grid

Instead of immediately generating an image from raw text, a virtual
terminal state was introduced.

The terminal is represented as a matrix/grid:

``` js
screen[row][column]
```

Each cell represents one terminal character position.

Conceptually:

``` js
{
    char: "e",
    color: "93"
}
```

Therefore:

``` text
1 cell ≈ 1 character position
```

A default terminal size of:

``` text
120 columns × 30 rows
```

contains:

``` text
3,600 cells
```

Empty cells are represented by a space/default color.

This grid becomes the intermediate representation between PTY data and
image rendering.

------------------------------------------------------------------------

## 21. `parser.js` Introduced

A `parser.js` module was created to interpret ANSI/control sequences.

Its responsibility is to transform raw PTY data into structured tokens
rather than directly drawing the data.

The parser produces token types such as:

### Text

``` js
{
    type: "text",
    text: "hello"
}
```

### Color

``` js
{
    type: "color",
    code: "93"
}
```

### Control

``` js
{
    type: "control",
    command: "H",
    params: "1;35"
}
```

The parser recognizes ANSI CSI sequences using a regular expression
conceptually similar to:

``` js
const ansiRegex = /\x1B\[([0-9;?]*)([A-Za-z])/g;
```

Examples encountered in real PowerShell output include:

``` text
ESC[93m
ESC[0m
ESC[1;35H
ESC[?25l
ESC[?25h
ESC[K
```

------------------------------------------------------------------------

## 22. `terminal-state.js` Introduced

A `TerminalState` class/module was introduced to interpret parsed tokens
and maintain the virtual screen.

The state tracks information such as:

``` js
cursorX
cursorY
currentColor
screen
```

Text tokens write characters into the current cursor position.

Color tokens update the active color.

Cursor-position sequences update the cursor location.

Basic control behavior was added for terminal-style operations such as:

-   newline
-   carriage return
-   backspace
-   cursor positioning

The key idea is:

``` text
parser
   ↓
tokens
   ↓
TerminalState
   ↓
final screen grid
```

------------------------------------------------------------------------

## 23. First Terminal-State Test

Before using real PowerShell data, a small artificial test was created:

``` text
Hello
RED
```

with `RED` represented using an ANSI color sequence.

The resulting terminal state successfully represented:

-   characters
-   row/column positions
-   color state
-   cursor state
-   empty cells

The state was also serialized to JSON for inspection.

This proved that the virtual terminal layer was functioning
independently of PowerShell.

------------------------------------------------------------------------

## 24. `[Object]` Problem in Console Output

When the terminal state contained arrays of objects, Node's normal
console representation displayed values such as:

``` text
[Object]
```

This was not a data-loss problem.

It was only Node's abbreviated object display.

For inspection, the terminal state was serialized using:

``` js
JSON.stringify(terminal, null, 2)
```

and written to a JSON file.

This made the full character/color/control structure visible and
testable.

------------------------------------------------------------------------

## 25. Preserving Raw + Parsed + Terminal State

The capture model was then expanded internally so that the processing
stages could be retained.

Conceptually:

``` js
{
    id,
    path,
    command,

    output: {
        raw,
        parsed,
        terminal
    }
}
```

The three stages have different purposes:

``` text
raw
 ↓
original PTY stream

parsed
 ↓
interpreted ANSI/control tokens

terminal
 ↓
reconstructed visible terminal state
```

### Why keep all three?

The raw stream is the source of truth.

If the parser or renderer is improved later, the raw data can be
processed again without executing the command again.

------------------------------------------------------------------------

## 26. Real Data Test

The test was changed from artificial data to real saved Capter history.

The test reads:

``` text
temp/history.json
```

takes a real command entry, extracts:

``` js
entry.output.raw
```

and sends it through:

``` text
buildTerminal()
```

This established the real pipeline:

``` text
history.json
     ↓
raw PTY data
     ↓
parser
     ↓
TerminalState
```

------------------------------------------------------------------------

## 27. `renderer.js` Introduced

Once the terminal grid was working, a renderer was created.

The renderer's job is to convert the virtual terminal screen into an
actual PNG.

The architecture became:

``` text
TerminalState
      ↓
Canvas
      ↓
draw characters
      ↓
apply colors
      ↓
PNG
```

Node Canvas was selected for the prototype.

The dependency is installed with:

``` bash
npm install canvas
```

The renderer is deterministic and local.

It does **not** use AI image generation.

------------------------------------------------------------------------

## 28. Why AI Image Generation Was Not Used

The goal is not to create an approximate terminal-looking image.

The image must preserve exact:

-   command text
-   output text
-   character positions
-   colors
-   spacing
-   terminal structure

AI image generation could modify or hallucinate text and layout.

Therefore the correct approach is deterministic rendering:

``` text
terminal grid
    ↓
Canvas drawing
    ↓
exact PNG
```

This also avoids network requests and model-inference latency.

------------------------------------------------------------------------

## 29. First Renderer Test

The renderer was first tested with artificial terminal data.

Input:

``` text
Hello
RED
```

Output:

-   `Hello` appeared in the default color.
-   `RED` appeared in red.
-   Line positioning worked.
-   A PNG file was successfully produced.

This proved:

``` text
TerminalState → PNG
```

worked independently of real PowerShell data.

------------------------------------------------------------------------

## 30. Real PowerShell Image Test

The renderer was then tested using actual Capter history.

The pipeline became:

``` text
temp/history.json
       ↓
output.raw
       ↓
buildTerminal()
       ↓
TerminalState
       ↓
renderTerminal()
       ↓
temp/real-terminal.png
```

A real command:

``` powershell
echo "hello"
```

was successfully rendered as a terminal image containing:

``` text
PS C:\Users\caili\Desktop\capter> echo "hello"
hello
```

This was the first successful end-to-end real-data image test.

------------------------------------------------------------------------

## 31. Real Error Output Test

A PowerShell command-not-found case was then tested, for example:

``` powershell
hehj
```

The resulting image correctly reproduced the PowerShell error output and
its red text.

This verified that the system was not only handling simple text but was
also preserving terminal color information from real PTY output.

------------------------------------------------------------------------

## 32. Current Full Architecture

The current prototype architecture is:

``` text
                         ┌──────────────────────┐
                         │      PowerShell      │
                         │                      │
                         │      Get-History     │
                         └──────────┬───────────┘
                                    │
                         Base64(path|command)
                                    │
                                    ▼
                         Invisible OSC Marker
                         ESC]1337;Custom=...
                                    │
                                    ▼
                              node-pty
                                    │
                                    ▼
                              shell.js
                                    │
                         marker detection
                                    │
                                    ▼
                            raw command chunk
                                    │
                                    ▼
                              parser.js
                                    │
                              ANSI tokens
                                    │
                                    ▼
                         TerminalState/grid
                                    │
                         character + color
                         position + state
                                    │
                                    ▼
                             renderer.js
                                    │
                                  Canvas
                                    │
                                    ▼
                              PNG image
```

------------------------------------------------------------------------

## 33. Current Data Model

The conceptual command record remains:

``` js
{
    id,
    path,
    command,
    output
}
```

Internally, the output can preserve processing stages:

``` js
{
    id: 1,
    path: "C:\\Users\\caili\\Desktop\\capter",
    command: "echo \"hello\"",

    output: {
        raw: "...",
        parsed: [...],
        terminal: {
            screen: [...]
        }
    }
}
```

This separates command identity from the different representations of
its output.

------------------------------------------------------------------------

## 34. What the Prototype Has Proven

### Capture

-   Real PowerShell process can be captured through `node-pty`.
-   Keyboard input can be forwarded.
-   Raw PTY output can be preserved.

### Command Identification

-   PowerShell `Get-History` provides command metadata.
-   Invisible in-stream markers associate metadata with the PTY stream.
-   Command/output association no longer depends on arrival timing.
-   Startup hook output can be ignored with the first-time flag.

### Terminal Processing

-   Raw ANSI/control sequences can be parsed.
-   Terminal output can be represented as a grid.
-   Individual cells can store characters and colors.
-   Cursor positioning can be interpreted.

### Image Rendering

-   Terminal state can be rendered to PNG.
-   Normal PowerShell output works.
-   Colored PowerShell errors work.
-   Rendering is local and deterministic.

------------------------------------------------------------------------

## 35. Why the Terminal Grid Is Not Wasteful

A terminal grid such as:

``` text
120 × 30
```

contains:

``` text
3,600 cells
```

Many cells will normally be empty:

``` js
{
    char: " ",
    color: "default"
}
```

This is expected.

The grid represents the available terminal screen, not just the
characters that happened to be printed.

For the renderer, unused cells can later be ignored or cropped.

------------------------------------------------------------------------

## 36. Performance Strategy

The current architecture is intended to be fast for normal users because
it is entirely local:

``` text
PTY
 ↓
local parser
 ↓
local terminal state
 ↓
local Canvas
 ↓
PNG
```

There is no requirement for:

-   remote server processing
-   external API calls
-   AI inference
-   image-generation service

The main future optimization is to render only the used terminal region.

For example:

``` text
Full terminal:
120 × 30

Actual content:
80 × 6

Future renderer:
render 80 × 6
```

This reduces unnecessary drawing and produces smaller images.

------------------------------------------------------------------------

## 37. Prototype vs Production

The prototype is now considered **complete at the proof-of-concept
level**.

The fundamental architecture should not be repeatedly redesigned.

The next stage is productionization.

### Prototype status

``` text
Command capture             ✅
Command/output matching     ✅
Raw preservation            ✅
ANSI parsing                ✅
Terminal grid               ✅
Color handling              ✅
PNG rendering               ✅
Real PowerShell test        ✅
Error-output test           ✅
```

------------------------------------------------------------------------

## 38. Known Production Limitations

The current terminal implementation is not a complete terminal emulator.

Areas still requiring work include:

-   full VT/ANSI compatibility
-   erase-line (`ESC[K`)
-   erase-screen operations
-   complete cursor behavior
-   cursor visibility
-   scrolling
-   background colors
-   bold/underline/reverse attributes
-   256-color support
-   true-color support
-   Unicode/wide characters
-   tabs
-   alternate screen buffers
-   interactive terminal applications
-   terminal resizing
-   accurate font metrics
-   automatic cropping
-   high-DPI output

These are productionization tasks, not failures of the core prototype.

------------------------------------------------------------------------

## 39. Recommended Next Phase

### Phase 1 --- Stabilization

-   clean module boundaries
-   automated tests
-   parser edge-case tests
-   renderer tests
-   error handling
-   remove temporary/debug code

### Phase 2 --- Terminal Compatibility

Implement additional VT/ANSI behavior:

``` text
cursor
erase
scroll
colors
text attributes
Unicode
```

### Phase 3 --- Better Image Rendering

Add:

-   automatic content cropping
-   configurable font
-   configurable dimensions
-   padding
-   background customization
-   high-DPI support

### Phase 4 --- Package API

Hide the internal architecture behind a simple npm API.

Conceptually:

``` js
const image = await capter.capture({
    command: "echo hello"
});
```

The user should not need to know about:

-   OSC markers
-   ANSI parsing
-   terminal grids
-   Canvas
-   PTY buffering

### Phase 5 --- Performance

Benchmark:

-   many commands executed rapidly
-   large command output
-   long-running commands
-   large terminal dimensions
-   repeated image generation

Then optimize only where profiling shows a real bottleneck.

------------------------------------------------------------------------

## 40. Final Journey Summary

The Capter project evolved through several important architectural
stages:

``` text
1. PTY capture
       ↓
2. Visible command markers
       ↓
3. Command queue / IDs
       ↓
4. File-based command communication
       ↓
5. Timing/boundary problem discovered
       ↓
6. Invisible in-stream OSC markers
       ↓
7. Reliable command/output association
       ↓
8. Raw ANSI preservation
       ↓
9. ANSI parser
       ↓
10. Virtual TerminalState grid
       ↓
11. Raw + parsed + terminal representations
       ↓
12. Canvas renderer
       ↓
13. Real PowerShell → PNG test
       ↓
14. Colored error → PNG test
       ↓
15. Prototype complete
```

### Final principle

The central design decision is:

> **Capture first, preserve raw data, interpret later.**

The system therefore does not destroy terminal information during
capture.

The final transformation is:

``` text
Real command
    ↓
Real PTY stream
    ↓
Reliable command boundary
    ↓
Raw terminal data
    ↓
ANSI/control parser
    ↓
Virtual terminal grid
    ↓
Deterministic renderer
    ↓
Terminal image
```

The prototype has successfully demonstrated the complete concept. The
next work is to make this implementation robust, compatible, fast, and
convenient as a reusable npm package.
