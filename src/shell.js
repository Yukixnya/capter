import pty from "node-pty";
import path from "path";
import os from "os";
import { addCommand, getHistory } from "./history.js";
import { parseOutput } from "./parser.js";

import { saveCap } from "../tests/pty-capture-writer.js";

export function startShell() {
    const cols = process.stdout.columns || 120;
    const rows = process.stdout.rows || 30;

    const shell = pty.spawn(
        "powershell.exe",
        [
            "-NoExit",
            "-Command",
            ". ./src/powershell-hook.ps1"
        ],
        {
            name: "xterm-color",
            cols,
            rows,
            cwd: process.cwd(),
            env: { ...process.env }
        }
    );

    process.stdout.on("resize", () => {
        shell.resize(
            process.stdout.columns || 120,
            process.stdout.rows || 30
        );
    });

    let capData = "";
    let outputBuffer = "";
    let isFirstTime = true;

    shell.onData((data) => {
        // Write directly to terminal. The OSC marker is an invisible control code, 
        // so the terminal will swallow it silently.
        process.stdout.write(data);
        
        capData += data;
        outputBuffer += data;

        // Our custom OSC sequence looks like: \x1B]1337;Custom=CapterMarker:BASE64\x07
        const markerRegex = /\x1B\]1337;Custom=CapterMarker:([A-Za-z0-9+/=]+)\x07/g;
        
        let match;
        let lastMatchEndIndex = 0;

        // Loop through all markers found in the current buffer
        while ((match = markerRegex.exec(outputBuffer)) !== null) {
            const base64Data = match[1];
            const decoded = Buffer.from(base64Data, 'base64').toString('utf8');
            
            const sep = decoded.indexOf("|");
            const cmdPath = decoded.slice(0, sep);
            const cmdText = decoded.slice(sep + 1);
            
            // The visual output for this command is everything in the buffer
            // up to the start of this marker.
            const chunk = outputBuffer.slice(lastMatchEndIndex, match.index);

            if (isFirstTime) {
                isFirstTime = false;
            } else {
                const parsedOutput = parseOutput(chunk);
    
                addCommand(cmdPath, cmdText, parsedOutput);
                // addCommand(cmdPath, cmdText, chunk);
            }


            lastMatchEndIndex = markerRegex.lastIndex;
        }

        // Keep the rest of the buffer for the next command
        if (lastMatchEndIndex > 0) {
            outputBuffer = outputBuffer.slice(lastMatchEndIndex);
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on("data", (data) => {
        shell.write(data);
    });

    shell.onExit(({ exitCode }) => {
        saveCap(capData, exitCode);

        process.stdin.setRawMode(false);

        console.log(
            `\nCapter Session Ended. Exit Code: ${exitCode}`
        );

        console.log("\nHistory:");
        console.log(getHistory());

        process.exit(exitCode);
    });
}