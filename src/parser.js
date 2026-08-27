function cleanAnsi(text) {
    return text
        .replace(/\x1B\][^\x07]*(?:\x07|\x1B\\)/g, "")
        .replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, "");
}

export function detectCommands(capData) {
    const clean = cleanAnsi(capData);

    const promptRegex = /PS ([A-Za-z]:\\[^>\r\n]*)>\s*/g;

    const commands = [];
    let match;

    while ((match = promptRegex.exec(clean)) !== null) {
        const start = promptRegex.lastIndex;

        const nextPrompt = promptRegex.exec(clean);
        const end = nextPrompt ? nextPrompt.index : clean.length;

        let block = clean.slice(start, end);

        // Remove PowerShell continuation prompts
        block = block.replace(/^>>\s?/gm, "");

        const lines = block.split(/\r?\n/);

        // Remove empty lines
        while (lines.length && !lines[0].trim()) {
            lines.shift();
        }

        if (!lines.length) {
            if (!nextPrompt) break;
            promptRegex.lastIndex = nextPrompt.index;
            continue;
        }

        const command = lines.shift().trim();

        const output = lines.join("\r\n").trim();

        commands.push({
            path: match[1],
            command,
            output
        });

        if (!nextPrompt) break;

        promptRegex.lastIndex = nextPrompt.index;
    }

    return commands;
}