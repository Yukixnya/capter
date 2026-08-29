export function parseOutput(raw) {
    return {
        raw,
        lines: raw.split(/\r?\n/)
    };
}