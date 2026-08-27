const MAX_COMMANDS = 20;

const commandQueue = [];
let nextCommandId = 1;

export function addCommand(command,output="",error="",exitCode=0){

    if (commandQueue.length >= MAX_COMMANDS){
        commandQueue.shift();
    }

    commandQueue.push({
        id:nextCommandId++,
        command,
        output,
        error,
        exitCode,
        timestamp: new Date().toDateString()
    });
}

export function getHistory() {
    return commandQueue;
}