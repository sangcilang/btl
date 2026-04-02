Param(
    [string]$TargetDir,
    [int]$BatchSize = 5
)

if (-not (Test-Path $TargetDir)) {
    Write-Host "Target directory '$TargetDir' does not exist."
    exit 0
}

$dirs = Get-ChildItem $TargetDir -Directory | Select-Object -First $BatchSize
foreach ($d in $dirs) {
    Remove-Item -Recurse -Force $d.FullName
}

if (-not (Get-ChildItem $TargetDir -Directory)) {
    Remove-Item $TargetDir -Force -Recurse
}
