import { spawn } from "node:child_process";

export function startShell() {
    const shell = spawn("powershell.exe",
    [
        "-NoExit",
        "-Command",
        ". ./src/powershell-hook.ps1"
    ], 
    {
        stdio: "inherit",
        shell: false
    });

    shell.on("exit", (code) => {
        console.log(`\nCapter Session Ended. Exit Code: ${code}`);
    });

    shell.on("error", (error) => {
        console.log("\nFalied to start the PowerShell:", error.message);
    });

}