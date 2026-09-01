# Capter CLI Commands

Capter provides a simple CLI for capturing, managing, viewing, and rendering terminal commands.

## Start Capter

```bash
capter
````

Starts an interactive terminal session with Capter capture enabled.

---

## List Captured Commands

```bash
capter list
```

Displays all captured commands with their IDs and paths.

Example:

```text
ID   COMMAND              PATH
1    echo "hello"         C:\project
2    pwd                  C:\project
3    npm install          C:\project
```

---

## Show Command Details

```bash
capter show <id>
```

Displays information about a specific captured command.

Example:

```bash
capter show 3
```

---

## Capture / Render a Command

```bash
capter cap <id>
```

Generates a terminal image for the specified command.

Example:

```bash
capter cap 4
```

---

## Capture Multiple Commands

```bash
capter cap <id> <id> <id>
```

Example:

```bash
capter cap 1 3 7
```

Generates images for commands `1`, `3`, and `7`.

---

## Capture a List of Commands

```bash
capter cap --list <ids>
```

Example:

```bash
capter cap --list 1,3,5,7
```

Generates images for the specified command IDs.

A range can also be supported:

```bash
capter cap --list 1-10
```

---

## Clear History

```bash
capter clear
```

Clears the stored command history.

---

## Help

```bash
capter help
```

or:

```bash
capter --help
```

Displays available Capter commands and options.

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

| Command                   | Description                         |
| ------------------------- | ----------------------------------- |
| `capter`                  | Start an interactive Capter session |
| `capter list`             | List captured commands              |
| `capter show <id>`        | Show command details                |
| `capter cap <id>`         | Render one command                  |
| `capter cap <id> <id>`    | Render multiple commands            |
| `capter cap --list <ids>` | Render a list of commands           |
| `capter clear`            | Clear command history               |
| `capter help`             | Show help                           |
| `capter --help`           | Show help                           |
| `capter --version`        | Show Capter version                 |

## Planned Commands

Additional commands may be introduced later, such as:

```bash
capter export <id>
capter export <id> --format png
capter export <id> --format json
capter export <id> --format txt
```

These would allow captured terminal sessions to be exported in different formats.