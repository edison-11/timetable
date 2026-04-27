# File Upload Test Script

# Get authentication token
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.token

Write-Host "Token obtained: $token" -ForegroundColor Green

# Test file upload using curl (since PowerShell Invoke-RestMethod doesn't support multipart forms well)
$curlCommand = @"
curl -X POST "http://localhost:5000/api/upload/single" `
  -H "Authorization: Bearer $token" `
  -F "file=@test-upload.txt" `
  -v
"@

Write-Host "Testing file upload..." -ForegroundColor Yellow
Invoke-Expression $curlCommand
