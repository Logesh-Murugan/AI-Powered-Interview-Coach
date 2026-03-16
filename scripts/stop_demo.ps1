param(
    [int[]]$Ports = @(8000, 5173)
)

$ErrorActionPreference = "Stop"

$stateFile = Join-Path $PSScriptRoot ".demo-processes.json"
$processes = @()

if (Test-Path $stateFile) {
    $state = Get-Content $stateFile | ConvertFrom-Json
    $processes = @($state.processes)
}

if (-not $processes -or $processes.Count -eq 0) {
    foreach ($port in $Ports) {
        $processes += [pscustomobject]@{
            name = "port-$port"
            pid = $null
            port = $port
        }
    }
}

foreach ($processInfo in $processes) {
    $stopped = $false

    if ($processInfo.PSObject.Properties.Name -contains "port") {
        $listeners = Get-NetTCPConnection -LocalPort $processInfo.port -State Listen -ErrorAction SilentlyContinue
        $listenerPids = $listeners | Select-Object -ExpandProperty OwningProcess -Unique

        foreach ($listenerPid in $listenerPids) {
            if ($listenerPid) {
                Write-Host "Stopping $($processInfo.name) listener on port $($processInfo.port) (PID $listenerPid)..." -ForegroundColor Cyan
                Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
                $stopped = $true
            }
        }
    }

    if (-not $stopped) {
        $process = Get-Process -Id $processInfo.pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host "Stopping $($processInfo.name) launcher (PID $($processInfo.pid))..." -ForegroundColor Cyan
            Stop-Process -Id $processInfo.pid -Force -ErrorAction SilentlyContinue
        }
    }
}

if (Test-Path $stateFile) {
    Remove-Item $stateFile -Force
}

Write-Host "Demo processes stopped." -ForegroundColor Green
