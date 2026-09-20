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

    ensureRow(y) {
        while (y >= this.rows) {
            this.screen.push(
                Array.from({ length: this.cols }, () => ({
                    char: " ",
                    color: "default"
                }))
            );
            this.rows++;
        }
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
                this.cursorX = Math.max(0, this.cursorX - 1);
                continue;
            }

            this.ensureRow(this.cursorY);

            if (this.cursorX >= this.cols) {
                continue; // ConPTY wraps for us, so we just drop over-column chars until \r\n
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
        this.ensureRow(this.cursorY);
    }

    trim(padding = 1) {
        // Find the last row that actually has visible text
        let lastVisibleRow = -1;
        for (let i = this.rows - 1; i >= 0; i--) {
            if (this.screen[i].some(cell => cell.char !== " ")) {
                lastVisibleRow = i;
                break;
            }
        }

        // Set the new total rows to the last visible row + padding
        const newTotalRows = Math.max(0, lastVisibleRow + 1 + padding);
        
        // Remove excess rows from the array
        if (this.rows > newTotalRows) {
            this.screen.splice(newTotalRows);
            this.rows = newTotalRows;
        } else {
            // If the buffer is somehow too small, ensure we have the padding
            this.ensureRow(newTotalRows - 1);
        }
    }
}