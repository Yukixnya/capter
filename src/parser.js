import { TerminalState } from "./terminal-state.js";

export function parseOutput(raw) {
    const tokens = [];

    const ansiRegex = /\x1B\[([0-9;?]*)([A-Za-z])/g;

    let lastIndex = 0;
    let match;

    while ((match = ansiRegex.exec(raw)) !== null) {

        // Text before ANSI sequence
        if (match.index > lastIndex) {
            tokens.push({
                type: "text",
                text: raw.slice(lastIndex, match.index)
            });
        }

        const params = match[1];
        const command = match[2];

        if (command === "m") {
            tokens.push({
                type: "color",
                code: params
            });
        } else {
            tokens.push({
                type: "control",
                command,
                params
            });
        }

        lastIndex = ansiRegex.lastIndex;
    }

    // Remaining text
    if (lastIndex < raw.length) {
        tokens.push({
            type: "text",
            text: raw.slice(lastIndex)
        });
    }

    return tokens;
}


export function buildTerminal(raw, cols = 120, rows = 30) {
    const tokens = parseOutput(raw);

    const terminal = new TerminalState(cols, rows);

    for (const token of tokens) {

        if (token.type === "text") {
            terminal.write(token.text);
        }

        else if (token.type === "color") {
            terminal.setColor(token.code);
        }

        else if (
            token.type === "control" &&
            token.command === "H"
        ) {
            const [row, col] = token.params
                .split(";")
                .map(Number);

            terminal.moveCursor(row, col);
        }
    }

    return terminal;
}