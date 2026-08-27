# Skip commands already in history at startup (e.g. the dot-sourcing command)
$_startupCmd = Get-History -Count 1
if ($_startupCmd) {
    $global:_capter_last_id = $_startupCmd.Id
} else {
    $global:_capter_last_id = 0
}

function prompt {
    $lastCmd = Get-History -Count 1
    if ($lastCmd -and $lastCmd.Id -ne $global:_capter_last_id) {
        $global:_capter_last_id = $lastCmd.Id
        try {
            [IO.File]::AppendAllText($env:CAPTER_CMD_FILE, (Get-Location).Path + "|" + $lastCmd.CommandLine + "`n")
        } catch {}
    }
    $currentPath = (Get-Location).Path
    return "PS $currentPath> "
}