param(
    [switch]$Full
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action
    )

    Write-Host ""
    Write-Host "==> $Name" -ForegroundColor Cyan
    & $Action
    Write-Host "[PASS] $Name" -ForegroundColor Green
}

Write-Host "InterviewMaster AI release validation" -ForegroundColor Yellow
Write-Host "Repo: $repoRoot"
Write-Host "Mode: $(if ($Full) { 'full' } else { 'quick' })"

Invoke-Step "Backend smoke validation" {
    Push-Location $backendDir
    try {
        python scripts\demo_smoke_validation.py
    }
    finally {
        Pop-Location
    }
}

Invoke-Step "Frontend type-check" {
    Push-Location $frontendDir
    try {
        npm.cmd run type-check
    }
    finally {
        Pop-Location
    }
}

Invoke-Step "Frontend build" {
    Push-Location $frontendDir
    try {
        npm.cmd run build
    }
    finally {
        Pop-Location
    }
}

Invoke-Step "Frontend critical service tests" {
    Push-Location $frontendDir
    try {
        npm.cmd test -- --run `
            src/services/__tests__/userService.test.ts `
            src/services/__tests__/resumeAnalysisService.test.ts `
            src/services/__tests__/companyCoachingService.test.ts `
            src/services/__tests__/studyPlanService.test.ts
    }
    finally {
        Pop-Location
    }
}

if ($Full) {
    Invoke-Step "Backend pytest (non-property)" {
        Push-Location $backendDir
        try {
            python -m pytest tests -q --ignore=tests/property
        }
        finally {
            Pop-Location
        }
    }

    Invoke-Step "Backend pytest (property)" {
        Push-Location $backendDir
        try {
            python -m pytest tests/property -q
        }
        finally {
            Pop-Location
        }
    }
}

Write-Host ""
Write-Host "Release validation completed successfully." -ForegroundColor Green
Write-Host "This build is safe for demo only if this script stays green." -ForegroundColor Green
