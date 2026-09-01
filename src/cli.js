#!/usr/bin/env node

import { startShell, stopShell } from "./shell.js";
import { showHelp } from "./commands/help.js";
import { getListCommands } from "./commands/list.js";

const args = process.argv.slice(2);

if (args.length === 0) {
    showHelp();
    process.exit(0);
}

switch (args[0]) {
    case "capture":
        console.log("Capter is Loading");
        startShell();
        console.log("Capter is Activated");
        break;

    case "--help":
    case "-h":
        showHelp();
        break;

    case "exit":
        console.log("Exiting capter ...");
        stopShell(shell);
        console.log("Capter is Deactivated.");
        break

    case "--version":
    case "-v":
        console.log("Capter version: 1.0.0");
        break;

    case "-ls":
        getListCommands();
        break;

    default:
        console.log(`Unknown command: ${args[0]}`);
        showHelp();
}