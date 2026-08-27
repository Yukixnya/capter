import fs from "fs";
import { detectCommands } from "../src/parser.js";

const data = JSON.parse(
    fs.readFileSync("./temp/pty-capture.json", "utf8")
);

const commands = detectCommands(data.capData);

console.log(JSON.stringify(commands, null, 2));