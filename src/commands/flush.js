import fs from "fs";
import os from "os";
import path from "path";

const capterTemp = path.join(os.tmpdir(), "capter");

export function clearCapterData() {
    if (!fs.existsSync(capterTemp)) {
        console.log("No Capter temp data found.");
        return;
    }

    fs.rmSync(capterTemp, {
        recursive: true,
        force: true
    });

    console.log("Capter temp data cleared.");
}