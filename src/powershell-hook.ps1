function prompt {

    $currentPath = (Get-Location).Path

    $global:LAST_CAPTER_COMMAND = GET-HISTORY -Count 1

    "PS $currentPath>"
}