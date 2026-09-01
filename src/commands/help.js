export function showHelp() {
    console.log(`

Usage: capter [-h] [-v] [-l ids] [-i id] [-ls] [-r] [-tp] [-cap]

Options:
    --help              Display help information.
    --version           Display Capter version.
    -ls                 List all captured commands.
    -cap <id>           Capture/render a single command by ID.
    -cap -l <ids>       Capture/render multiple commands by IDs.
    -r                  Show the 3 most recent commands.
    -tp                 Show the 3 oldest commands.
    
Commands:
    capture capture            Start a Capter terminal capture session.
    capter exit                End the current Capter session.

Examples:
    capter capture
    capter exit
    capter -ls
    capter -cap 5
    capter -cap -l 1,2,5
    capter -r
    capter -tp
    capter --help
    capter --version

`);
}