import { createCanvas } from "canvas";
import fs from "fs";

const CHAR_WIDTH = 9;
const CHAR_HEIGHT = 18;

export function renderTerminal(terminal, outputPath = "./temp/terminal.png") {
    const { screen, cols, rows } = terminal;

    const canvas = createCanvas(
        cols * CHAR_WIDTH,
        rows * CHAR_HEIGHT
    );

    const ctx = canvas.getContext("2d");

    // Terminal background
    ctx.fillStyle = "#000000";
    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.font = "14px Consolas";
    ctx.textBaseline = "top";

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {

            const cell = screen[row][col];

            if (!cell || cell.char === " ") {
                continue;
            }

            ctx.fillStyle = ansiColor(cell.color);

            ctx.fillText(
                cell.char,
                col * CHAR_WIDTH,
                row * CHAR_HEIGHT
            );
        }
    }

    fs.mkdirSync("./temp", { recursive: true });

    fs.writeFileSync(
        outputPath,
        canvas.toBuffer("image/png")
    );

    return outputPath;
}


function ansiColor(code) {
    switch (code) {
        case "30": return "#000000";
        case "31": return "#ff5555";
        case "32": return "#55ff55";
        case "33": return "#ffff55";
        case "34": return "#5555ff";
        case "35": return "#ff55ff";
        case "36": return "#55ffff";
        case "37": return "#ffffff";

        case "90": return "#555555";
        case "91": return "#ff5555";
        case "92": return "#55ff55";
        case "93": return "#ffff55";
        case "94": return "#5555ff";
        case "95": return "#ff55ff";
        case "96": return "#55ffff";
        case "97": return "#ffffff";

        case "38;5;9": return "#ff0000";

        default: return "#ffffff";
    }
}