import pty from "node-pty";
import { saveCap } from "./pty-capture-writer.js";

const shell = pty.spawn("powershell.exe",
    [],
    {
        name: "xterm-color",
        cols: 120,
        rows: 30,
        cwd: process.cwd(),
        env: process.env
    });



let capData = "";

shell.onData((data) => {
    // console.log(JSON.stringify(data));
    capData += data;
    process.stdout.write(data);
});

process.stdin.on("data", (data) => {
    shell.write(data.toString());
});

shell.onExit(({exitCode}) => {
    saveCap(capData,exitCode);
    console.log(`\nPowerShell exited: ${exitCode}`);
    process.exit();
});