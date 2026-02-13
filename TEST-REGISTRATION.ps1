# Test Registration and Login
Write-Host "Testing Backend API..." -ForegroundColor Cyan
Write-Host ""

# Generate random email
$randomNum = Get-Random -Minimum 1000 -Maximum 9999
$testEmail = "testuser$randomNum@example.com"
$testPassword = "Test123!@#"
$testName = "Test User $randomNum"

Write-Host "Test Credentials:" -ForegroundColor Yellow
Write-Host "Email: $testEmail"
Write-Host "Password: $testPassword"
Write-Host "Name: $testName"
Write-Host ""

# Test Registration
Write-Host "1. Testing Registration..." -ForegroundColor Cyan
$registerBody = @{
    email = $testEmail
    password = $testPassword
    name = $testName
} | ConvertTo-Json

try {
    $registerResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000/api/v1/auth/register" -Method POST -ContentType "application/json" -Body $registerBody
    
    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "Registration successful!" -ForegroundColor Green
    Write-Host "User ID: $($registerData.user.id)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Login
Write-Host "2. Testing Login..." -ForegroundColor Cyan
$loginBody = @{
    email = $testEmail
    password = $testPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000/api/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "Login successful!" -ForegroundColor Green
    Write-Host "User: $($loginData.user.name)" -ForegroundColor Gray
    Write-Host ""
    
    $accessToken = $loginData.access_token
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test Protected Endpoint
Write-Host "3. Testing Protected Endpoint..." -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $meResponse = Invoke-WebRequest -UseBasicParsing -Uri "http://localhost:8000/api/v1/users/me" -Method GET -Headers $headers
    
    $meData = $meResponse.Content | ConvertFrom-Json
    Write-Host "Protected endpoint works!" -ForegroundColor Green
    Write-Host "User: $($meData.name)" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "Protected endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "================================================" -ForegroundColor Green
Write-Host "All tests passed! Backend is working correctly." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Now try the frontend at: http://localhost:5173" -ForegroundColor Cyan
Write-Host "Use these credentials to login:" -ForegroundColor Yellow
Write-Host "Email: $testEmail"
Write-Host "Password: $testPassword"
Write-Host ""
