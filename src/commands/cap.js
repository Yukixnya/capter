import { buildTerminal } from "../parser.js";
import { renderTerminal } from "../renderer.js";
import fs from "fs";
import path from "path";
import os from "os";

const filepath = path.join(os.tmpdir(), "capter", "history.json");
const folderPath = path.join(os.homedir(), "Desktop", "capter-results");


export function capTerminal(id) {

    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }

    try {
        const history = JSON.parse(
            fs.readFileSync(filepath, "utf8")
        );

        const entry = history.find(item => item.id === Number(id));

        if(!entry){
            console.error(`No entry found with ID: ${id}`);
            return;
        }

        const raw = entry.output.raw;
    
        const terminal = buildTerminal(raw, 120, 30);
    
        renderTerminal(terminal, path.join(folderPath, `command-${id}.png`));
    
        console.log(`Generated: ${path.join(folderPath, `command-${id}.png`)}`);
    }
    
    catch (error) {
        console.error("File History not found or flushed:", error.message);
    }
}
