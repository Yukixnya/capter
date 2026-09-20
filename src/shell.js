import pty from "node-pty";
import { addCommand, getHistory } from "./history.js";
import { buildTerminal, parseOutput } from "./parser.js";

import { saveCap, saveHistory } from "../utility/saveTemp.js";

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
            let chunk = outputBuffer.slice(lastMatchEndIndex, match.index);

            // Normalize absolute Y coordinates emitted by ConPTY (Y-Axis Shifter)
            // This anchors every command's output back to row 1 on a fresh canvas.
            const rowRegex = /\x1B\[(\d+);(\d+)H/g;
            let minRow = Infinity;
            let rowMatch;
            
            while ((rowMatch = rowRegex.exec(chunk)) !== null) {
                const row = parseInt(rowMatch[1], 10);
                if (row < minRow) minRow = row;
            }
            
            if (minRow !== Infinity && minRow > 1) {
                const offset = minRow - 1;
                chunk = chunk.replace(/\x1B\[(\d+);(\d+)H/g, (fullMatch, rowStr, colStr) => {
                    const newRow = parseInt(rowStr, 10) - offset;
                    return `\x1B[${newRow};${colStr}H`;
                });
            }

            if (isFirstTime) {
                isFirstTime = false;
            } else {

                const terminal = buildTerminal(chunk);

                addCommand(cmdPath, cmdText, {
                    raw: chunk,
                    parsed: parseOutput(chunk),
                    terminal
                });

                // addCommand(cmdPath, cmdText, terminal);
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
        // const command = data.toString().trim();

        // if (command === "capter exit") {
        //     console.log("Exiting capter ...");
        //     stopShell(shell);
        //     console.log("Capter is Deactivated.");
        //     return;
        // }

        shell.write(data);
    });

    shell.onExit(({ exitCode }) => {
        saveCap(capData, exitCode);

        process.stdin.setRawMode(false);

        console.log(
            `\nCapter Session Ended. Exit Code: ${exitCode}`
        );

        console.log("\nHistory:");
        // console.log(getHistory());
        console.log(getHistory());
        saveHistory();

        process.exit(exitCode);
    });
}


export function stopShell(shell) {
    shell.kill();
}