param(
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173,
    [int]$RedisPort = 6379
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"
$stateFile = Join-Path $PSScriptRoot ".demo-processes.json"

# Prefer explicit Python path to avoid PATH issues; fallback to py launcher
$PythonExe = "C:\Users\Logesh\AppData\Local\Programs\Python\Python310\python.exe"
if (-not (Test-Path $PythonExe)) {
    $PythonExe = "py -3.10"
}

function Test-ListeningPort {
    param([int]$Port)
    return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Wait-HttpReady {
    param(
        [string]$Url,
        [string]$Name,
        [int]$TimeoutSeconds = 60
    )

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    do {
        try {
            $response = Invoke-WebRequest -UseBasicParsing $Url -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 500) {
                Write-Host "[PASS] $Name is ready at $Url" -ForegroundColor Green
                return
            }
        }
        catch {
            Start-Sleep -Seconds 2
        }
    } while ((Get-Date) -lt $deadline)

    throw "$Name did not become ready within $TimeoutSeconds seconds: $Url"
}

function Start-ServiceIfNeeded {
    param(
        [string]$Name,
        [string]$DisplayName
    )

    $service = Get-Service -Name $Name -ErrorAction SilentlyContinue
    if (-not $service) {
        Write-Host "[WARN] $DisplayName service '$Name' not found." -ForegroundColor Yellow
        return $false
    }

    if ($service.Status -ne "Running") {
        Write-Host "Starting $DisplayName service '$Name'..." -ForegroundColor Cyan
        Start-Service -Name $Name
        $service.WaitForStatus("Running", "00:00:30")
    }
    else {
        Write-Host "$DisplayName service '$Name' is already running." -ForegroundColor DarkCyan
    }

    return $true
}

function Start-TerminalProcess {
    param(
        [string]$Name,
        [string]$WorkingDirectory,
        [string]$Command
    )

    Write-Host "Launching $Name..." -ForegroundColor Cyan
    $process = Start-Process `
        -FilePath "powershell.exe" `
        -ArgumentList @(
            "-NoExit",
            "-Command",
            "Set-Location '$WorkingDirectory'; `$host.UI.RawUI.WindowTitle = '$Name'; $Command"
        ) `
        -PassThru

    return $process
}

Write-Host "InterviewMaster AI demo startup" -ForegroundColor Yellow
Write-Host "Repo: $repoRoot"

$startedProcesses = @()

$postgresStarted = Start-ServiceIfNeeded -Name "postgresql-x64-18" -DisplayName "PostgreSQL"
if (-not $postgresStarted) {
    Write-Host "[WARN] PostgreSQL service was not auto-started. Make sure PostgreSQL is running before the demo." -ForegroundColor Yellow
}

$redisServiceStarted = Start-ServiceIfNeeded -Name "Redis" -DisplayName "Redis"
if (-not $redisServiceStarted -and -not (Test-ListeningPort -Port $RedisPort)) {
    $redisCommand = Get-Command redis-server.exe -ErrorAction SilentlyContinue
    if ($redisCommand) {
        $redisProcess = Start-TerminalProcess `
            -Name "InterviewMaster Redis" `
            -WorkingDirectory $repoRoot `
            -Command "& '$($redisCommand.Source)'"
        $startedProcesses += [pscustomobject]@{ name = "redis"; pid = $redisProcess.Id }
    }
    else {
        throw "Redis is not running and redis-server.exe was not found."
    }
}

if (-not (Test-ListeningPort -Port $BackendPort)) {
    $backendCmd = "$PythonExe -m uvicorn app.main:app --host 127.0.0.1 --port $BackendPort"
    Write-Host "Using backend command: $backendCmd" -ForegroundColor DarkGray
    $backendProcess = Start-TerminalProcess `
        -Name "InterviewMaster Backend" `
        -WorkingDirectory $backendDir `
        -Command $backendCmd
    $startedProcesses += [pscustomobject]@{ name = "backend"; pid = $backendProcess.Id; port = $BackendPort }
}
else {
    Write-Host "Backend is already listening on port $BackendPort." -ForegroundColor DarkCyan
}

if (-not (Test-ListeningPort -Port $FrontendPort)) {
    # Unblock esbuild binaries to avoid EPERM on Windows
    $esbuildPaths = @(
        (Join-Path $frontendDir "node_modules\esbuild-windows-64\esbuild.exe"),
        (Join-Path $frontendDir "node_modules\esbuild\bin\esbuild.exe")
    )
    foreach ($p in $esbuildPaths) {
        if (Test-Path $p) {
            try { Unblock-File -Path $p -ErrorAction SilentlyContinue } catch {}
        }
    }

    $frontendProcess = Start-TerminalProcess `
        -Name "InterviewMaster Frontend" `
        -WorkingDirectory $frontendDir `
        -Command "npm.cmd run dev -- --host 127.0.0.1 --port $FrontendPort"
    $startedProcesses += [pscustomobject]@{ name = "frontend"; pid = $frontendProcess.Id; port = $FrontendPort }
}
else {
    Write-Host "Frontend is already listening on port $FrontendPort." -ForegroundColor DarkCyan
}

Wait-HttpReady -Url "http://127.0.0.1:$BackendPort/health" -Name "Backend"
Wait-HttpReady -Url "http://127.0.0.1:$FrontendPort" -Name "Frontend"

$state = [pscustomobject]@{
    generated_at = (Get-Date).ToString("o")
    backend_url = "http://127.0.0.1:$BackendPort"
    frontend_url = "http://127.0.0.1:$FrontendPort"
    processes = $startedProcesses
}
$state | ConvertTo-Json -Depth 4 | Set-Content -Path $stateFile

Write-Host ""
Write-Host "Demo stack is ready." -ForegroundColor Green
Write-Host "Frontend: http://127.0.0.1:$FrontendPort" -ForegroundColor Green
Write-Host "Backend:  http://127.0.0.1:$BackendPort" -ForegroundColor Green
Write-Host ""
Write-Host "When you're done, run:" -ForegroundColor Yellow
Write-Host ".\scripts\stop_demo.ps1" -ForegroundColor Yellow
