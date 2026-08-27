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
        const end = nextPrompt
            ? nextPrompt.index
            : clean.length;

        const commandBlock = clean.slice(start, end).trim();

        if (commandBlock) {
            commands.push({
                path: match[1],
                command: commandBlock
            });
        }

        if (!nextPrompt) break;

        promptRegex.lastIndex = nextPrompt.index;
    }

    return commands;
}