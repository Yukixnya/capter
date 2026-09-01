import fs from "fs";
import os from "os";
import path from "path";
import { getHistory } from "../src/history.js";

const capterTemp = path.join(os.tmpdir(), "capter");

export function saveCap(data, exitCode) {
    fs.mkdirSync(capterTemp, { recursive: true });

    fs.writeFileSync(
        path.join(capterTemp, "pty-capture.json"),
        JSON.stringify({
            exitCode,
            capData: data
        }, null, 2),
        "utf8"
    );
}

export function saveHistory() {
    fs.mkdirSync(capterTemp, { recursive: true });

    fs.writeFileSync(
        path.join(capterTemp, "history.json"),
        JSON.stringify(getHistory(), null, 2),
        "utf8"
    );
}