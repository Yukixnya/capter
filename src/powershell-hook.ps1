# Skip commands already in history at startup
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
        
        $cmdPath = (Get-Location).Path
        $cmdText = $lastCmd.CommandLine
        
        # Base64 encode to safely pass through ConPTY without breaking ANY formatting
        $bytes = [System.Text.Encoding]::UTF8.GetBytes("${cmdPath}|${cmdText}")
        $base64 = [Convert]::ToBase64String($bytes)
        
        # Emit OSC 1337 invisible marker. 
        # [char]27 is ESC, [char]7 is BEL. Works in all PowerShell versions.
        $esc = [char]27
        $bel = [char]7
        Write-Host -NoNewline "${esc}]1337;Custom=CapterMarker:${base64}${bel}"
    }
    
    $currentPath = (Get-Location).Path
    return "PS $currentPath> "
}