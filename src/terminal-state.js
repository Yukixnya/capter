export class TerminalState {
    constructor(cols = 120, rows = 30) {
        this.cols = cols;
        this.rows = rows;

        this.cursorX = 0;
        this.cursorY = 0;

        this.color = "default";

        this.screen = Array.from(
            { length: rows },
            () =>
                Array.from(
                    { length: cols },
                    () => ({
                        char: " ",
                        color: "default"
                    })
                )
        );
    }

    write(text) {
        for (const char of text) {

            if (char === "\n") {
                this.cursorY++;
                this.cursorX = 0;
                continue;
            }

            if (char === "\r") {
                this.cursorX = 0;
                continue;
            }

            if (char === "\b") {
                this.cursorX = Math.max(
                    0,
                    this.cursorX - 1
                );
                continue;
            }

            if (
                this.cursorY >= this.rows ||
                this.cursorX >= this.cols
            ) {
                continue;
            }

            this.screen[this.cursorY][this.cursorX] = {
                char,
                color: this.color
            };

            this.cursorX++;
        }
    }

    setColor(code) {
        if (code === "" || code === "0") {
            this.color = "default";
        } else {
            this.color = code;
        }
    }

    moveCursor(row, col) {
        this.cursorY = Math.max(0, row - 1);
        this.cursorX = Math.max(0, col - 1);
    }
}