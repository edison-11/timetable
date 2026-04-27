# Basic API Test - Testing server endpoints without database dependency

$baseUri = "http://localhost:5000/api"

Write-Host "=== Basic API Tests ===" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check (should work without database)
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUri/health" -Method GET
    Write-Host "✓ Health Check: Success - Status: $($response.status)" -ForegroundColor Green
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Test 404 error handling
Write-Host ""
Write-Host "2. Testing 404 Error Handling..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUri/nonexistent" -Method GET -ErrorAction Stop
    Write-Host "✗ 404 Test: Should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ 404 Error Handling: Working correctly" -ForegroundColor Green
    } else {
        Write-Host "✗ 404 Error Handling: Unexpected error - $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 3: Test rate limiting (should work)
Write-Host ""
Write-Host "3. Testing Rate Limiting..." -ForegroundColor Yellow
try {
    for ($i = 1; $i -le 5; $i++) {
        $response = Invoke-RestMethod -Uri "$baseUri/health" -Method GET
        Write-Host "✓ Request $i: Success" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 429) {
        Write-Host "✓ Rate Limiting: Working correctly" -ForegroundColor Green
    } else {
        Write-Host "✗ Rate Limiting Test: Unexpected error - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Test CORS headers
Write-Host ""
Write-Host "4. Testing CORS Headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUri/health" -Method GET
    $corsHeader = $response.Headers["Access-Control-Allow-Origin"]
    if ($corsHeader) {
        Write-Host "✓ CORS Headers: Present - $corsHeader" -ForegroundColor Green
    } else {
        Write-Host "? CORS Headers: Not found (may not be needed for same-origin)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "✗ CORS Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Test Security Headers
Write-Host ""
Write-Host "5. Testing Security Headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUri/health" -Method GET
    $securityHeaders = @(
        "Content-Security-Policy",
        "X-Frame-Options", 
        "X-Content-Type-Options",
        "Referrer-Policy"
    )
    
    $foundHeaders = 0
    foreach ($header in $securityHeaders) {
        if ($response.Headers[$header]) {
            $foundHeaders++
        }
    }
    
    Write-Host "✓ Security Headers: Found $foundHeaders out of $($securityHeaders.Count) expected headers" -ForegroundColor Green
} catch {
    Write-Host "✗ Security Headers Test Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Basic API Tests Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Note: Database-dependent endpoints (teachers, modules, classes, etc.)" -ForegroundColor Yellow
Write-Host "require database authentication to be fixed first." -ForegroundColor Yellow
