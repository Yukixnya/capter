const MAX_COMMANDS = 20;

const commandQueue = [];
let nextCommandId = 1;

export function addCommand(path, command, output = "") {
    if (commandQueue.length >= MAX_COMMANDS) {
        commandQueue.shift();
    }

    const entry = {
        id: nextCommandId++,
        path,
        command,
        output
    };

    commandQueue.push(entry);
    return entry;
}

export function getHistory() {
    return commandQueue;
}