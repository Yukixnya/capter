import pty from "node-pty";
import fs from "fs";
import path from "path";
import os from "os";
import { addCommand, getHistory } from "./history.js";
import { saveCap } from "../tests/pty-capture-writer.js";

export function startShell() {
    const cols = process.stdout.columns || 120;
    const rows = process.stdout.rows || 30;

    // Create temp file for command communication
    const cmdFile = path.join(
        os.tmpdir(),
        `capter_cmds_${Date.now()}.txt`
    );
    fs.writeFileSync(cmdFile, "", "utf8");

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
            env: { ...process.env, CAPTER_CMD_FILE: cmdFile }
        }
    );

    process.stdout.on("resize", () => {
        shell.resize(
            process.stdout.columns || 120,
            process.stdout.rows || 30
        );
    });

    let capData = "";
    let processedLines = 0;

    // Current entry being tracked — output appended as data arrives
    let currentEntry = null;

    shell.onData((data) => {
        process.stdout.write(data);
        capData += data;

        // Check for new commands from the temp file.
        // The prompt function writes AFTER execution, so by the
        // time we see the prompt data the file is already updated.
        try {
            const content = fs.readFileSync(cmdFile, "utf8");
            const lines = content
                .split(/\r?\n/)
                .filter(Boolean);

            for (let i = processedLines; i < lines.length; i++) {
                const raw = lines[i].trim();
                const sep = raw.indexOf("|");
                const cmdPath = raw.slice(0, sep);
                const command = raw.slice(sep + 1);

                // Start a new entry — future data goes here
                currentEntry = addCommand(cmdPath, command);
            }

            processedLines = lines.length;
        } catch {
            // File might be locked momentarily
        }

        // Append this chunk to the active command
        if (currentEntry) {
            currentEntry.output += data;
        }
    });

    process.stdin.setRawMode(true);
    process.stdin.resume();

    process.stdin.on("data", (data) => {
        shell.write(data);
    });

    shell.onExit(({ exitCode }) => {
        try {
            fs.unlinkSync(cmdFile);
        } catch {
            // Best-effort cleanup
        }

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