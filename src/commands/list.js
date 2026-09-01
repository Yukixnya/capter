// list the commands with ids

import fs from "fs";
import os from "os";
import path from "path";


const file_path = path.join(os.tmpdir(), "capter", "history.json");

export function getListCommands() {

    if (!fs.existsSync(file_path)) {
        console.log("No commands captured yet.");
        return;
    }

    const history = JSON.parse(fs.readFileSync(file_path, "utf8"));

    if (history.length === 0) {
        console.log("No commands captured yet.");
        return;
    }
    
    console.log("Captured Commands:");

    console.log(`ID    Commands`);
    console.log(`-------------------------`);
    for (const item of history) {
        console.log(`${item.id}     ${item.command}`);
    }

    console.log(`\nTotal Captured Commands: ${history.length}`);
}