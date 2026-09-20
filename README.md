# Capter

**Capture the terminal. Reconstruct the experience.**

Capter is a Node.js terminal capture and rendering tool that records interactive terminal sessions and reconstructs them as images.

Unlike traditional terminal logging, Capter preserves terminal output at the PTY level, including ANSI colors, cursor movement, control sequences, and screen layout.

---

## What is Capter?

Capter captures your terminal session while you work.

It records:

- Commands
- Working directory
- Raw terminal output
- ANSI colors and formatting
- Cursor movement
- Terminal control sequences
- Terminal screen state

Captured commands can later be reconstructed and rendered as terminal images.

```text
Terminal Session
       │
       ▼
    PTY Capture
       │
       ▼
  Raw Terminal Data
       │
       ▼
      Parser
       │
       ▼
 Terminal State
       │
       ▼
    Renderer
       │
       ▼
    PNG Image
````

---

## Why Capter?

Most command logging systems store terminal sessions as plain text.

Capter preserves the **terminal experience itself**.

This makes it useful for:

* **Documentation** — create terminal screenshots from real sessions.
* **Tutorials** — preserve commands and their actual output.
* **Debugging** — keep a record of terminal activity and output.
* **Demonstrations** — turn terminal sessions into shareable images.
* **Developer tooling** — access captured terminal data programmatically.

The main goal is to make terminal output **reproducible, structured, and visually renderable**.

---

## Features

* Interactive terminal capture
* PTY-level terminal recording
* ANSI color preservation
* Cursor movement support
* Terminal control sequence handling
* Command history & Command IDs
* Terminal state reconstruction
* **ConPTY Cursor Normalization** (Immune to scroll-gap bugs)
* **Dynamic Infinite Canvas** (Flawlessly captures 100+ line outputs in a single image)
* PNG rendering (Local rendering without external services)
* Temporary data management

---

## Installation

Install Capter globally using npm:

```bash
npm install -g capter
```

Verify the installation:

```bash
capter --version
```

---

## Quick Start

Start a Capter session:

```bash
capter capture
```

You can then use the terminal normally:

```powershell
pwd
ls
echo "Hello World"
```

Capter captures the commands and their terminal output during the session.

After the session, captured commands can be listed and rendered.

---

# CLI Commands

## Start a Capture Session

```bash
capter capture
```

Starts an interactive terminal session with Capter capture enabled.

---

## List Captured Commands

```bash
capter -ls
```

Displays captured commands with their IDs, commands, and paths.

Example:

```text
Capter History

ID  COMMAND          PATH

1   echo "hello"     C:\project
2   pwd              C:\project
3   npm install      C:\project
```

---

## Render a Captured Command

```bash
capter -cap -i <id>
```

Reconstructs the terminal state of a captured command and renders it as a PNG image.

Example:

```bash
capter -cap -i 3
```

The generated image is saved to:

```text
Desktop/capter-results/command-3.png
```

---

## Clear Capter Data

```bash
capter flush
```

Removes Capter's temporary capture data, including stored command history and temporary files.

---

## Help

```bash
capter --help
```

or:

```bash
capter -h
```

Displays available commands and options.

---

## Version

```bash
capter --version
```

Displays the installed Capter version.

Example:

```text
capter v1.0.0
```

---

## Command Summary

| Command               | Description                          |
| --------------------- | ------------------------------------ |
| `capter capture`      | Start an interactive capture session |
| `capter -ls`          | List captured commands               |
| `capter -cap -i <id>` | Render a captured command            |
| `capter flush`        | Clear temporary Capter data          |
| `capter --help`       | Display help                         |
| `capter -h`           | Display help                         |
| `capter --version`    | Display Capter version               |

---

# How It Works

Capter uses several components to reconstruct the terminal.

### 1. PTY Capture

Capter uses `node-pty` to communicate with an interactive shell and capture the raw terminal stream.

### 2. Command Association

Command metadata is embedded into the PTY stream using an invisible OSC sequence.

This keeps command information synchronized with its corresponding terminal output, even when the PTY delivers data in multiple chunks.

### 3. ANSI Parsing

The raw terminal stream is parsed into structured terminal operations such as:

* Text
* Colors
* Cursor movement
* Control sequences

The original raw output is preserved.

### 4. Terminal State

The parsed operations are applied to a virtual terminal grid.

Each terminal position represents a cell containing its character and display attributes.

### 5. Dynamic Rendering

The reconstructed terminal state is analyzed to crop empty space and dynamically calculate the exact height required for the output. 
It is then rendered locally into a perfectly-fitted PNG image.

No external screenshot or rendering service is required.

---

# Example

A captured terminal session such as:

```text
PS C:\project> echo "Hello World"
Hello World
PS C:\project>
```

can be reconstructed into a terminal image while preserving its terminal formatting and layout.

---

# Storage

Capter currently stores temporary capture data in the operating system's temporary directory.

On Windows:

```text
%TEMP%\capter\
```

Typical files include:

```text
history.json
pty-capture.json
```

Rendered images are exported to:

```text
Desktop/capter-results/
```

Temporary Capter data can be removed using:

```bash
capter flush
```

---

# Current Status

Capter is currently under active development.

The core pipeline is implemented:

```text
PTY Capture
     ↓
Command Identification
     ↓
ANSI Parsing
     ↓
Terminal State Reconstruction
     ↓
Image Rendering
```

Current development is focused on improving CLI functionality, rendering, terminal compatibility, storage, and package reliability.

---


# Development

Clone the repository:

```bash
git clone <repository-url>
```

Install dependencies:

```bash
npm install
```

Run Capter locally:

```bash
npm start
```

---

# Contributing

Contributions, bug reports, and feature requests are welcome.

If you would like to contribute:

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Test the changes.
5. Submit a pull request.

---
