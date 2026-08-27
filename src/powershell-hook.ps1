Start-Transcript -Path "$env:TEMP\capter-test.txt" -Append

function prompt {
    $lastCommand = GET-HISTORY -Count 1

    if($lastCommand) {
        Write-Host ""
        Write-Host "Capter detected command:" -ForegroundColor Cyan
        Write-Host $lastCommand.CommandLine -ForegroundColor Yellow
    }

    $currentPath = (Get-Location).Path
    "PS $currentPath>"
}