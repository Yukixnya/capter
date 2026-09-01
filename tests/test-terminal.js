import { buildTerminal } from "../src/parser.js";
import { renderTerminal } from "../src/renderer.js";
import fs from "fs";

// const raw = `
// Hello
// \x1b[31mRED\x1b[0m
// `;


const history = JSON.parse(
    fs.readFileSync("./temp/history.json", "utf8")
);

const entry = history[0];

const raw = entry.output.raw;

const terminal = buildTerminal(raw, 120, 30);

renderTerminal(terminal, "./temp/real-terminal.png");

console.log("Generated: ./temp/real-terminal.png");

// console.log(JSON.stringify(terminal, null, 2));

// fs.writeFileSync(
//     "./temp/history-test.json",
//     JSON.stringify(terminal, null, 2),
//     "utf8"
// );

// renderTerminal(terminal);

