# API Testing Script for Timetable Management System

$baseUri = "http://localhost:5000/api"

Write-Host "=== Timetable Management System API Tests ===" -ForegroundColor Green
Write-Host ""

# Test 1: Health Check
Write-Host "1. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUri/health" -Method GET
    Write-Host "✓ Health Check: $response" -ForegroundColor Green
} catch {
    Write-Host "✗ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Authentication Routes
Write-Host ""
Write-Host "2. Testing Authentication Routes..." -ForegroundColor Yellow

# Test POST /api/auth/register
try {
    $body = @{
        username = "testuser"
        email = "test@example.com"
        password = "test123456"
        role = "student"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUri/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Auth Register: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Auth Register: $($_.Exception.Message)" -ForegroundColor Red
}

# Test POST /api/auth/login
try {
    $body = @{
        email = "john@school.com"
        password = "password123"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUri/auth/login" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Auth Login: Success" -ForegroundColor Green
    $token = $response.token
} catch {
    Write-Host "✗ Auth Login: $($_.Exception.Message)" -ForegroundColor Red
    $token = $null
}

# Test 3: Teachers Routes
Write-Host ""
Write-Host "3. Testing Teachers Routes..." -ForegroundColor Yellow

# Test GET /api/teachers
try {
    $response = Invoke-RestMethod -Uri "$baseUri/teachers" -Method GET
    Write-Host "✓ Get Teachers: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Teachers: $($_.Exception.Message)" -ForegroundColor Red
}

# Test POST /api/teachers/register
try {
    $body = @{
        name = "Test Teacher"
        email = "teacher@example.com"
        password = "password123"
        status = "active"
    } | ConvertTo-Json
    $response = Invoke-RestMethod -Uri "$baseUri/teachers/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✓ Teacher Register: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Teacher Register: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Modules Routes
Write-Host ""
Write-Host "4. Testing Modules Routes..." -ForegroundColor Yellow

# Test GET /api/modules
try {
    $response = Invoke-RestMethod -Uri "$baseUri/modules" -Method GET
    Write-Host "✓ Get Modules: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Modules: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Classes Routes
Write-Host ""
Write-Host "5. Testing Classes Routes..." -ForegroundColor Yellow

# Test GET /api/classes
try {
    $response = Invoke-RestMethod -Uri "$baseUri/classes" -Method GET
    Write-Host "✓ Get Classes: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Classes: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Sections Routes
Write-Host ""
Write-Host "6. Testing Sections Routes..." -ForegroundColor Yellow

# Test GET /api/sections
try {
    $response = Invoke-RestMethod -Uri "$baseUri/sections" -Method GET
    Write-Host "✓ Get Sections: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Sections: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 7: Rooms Routes
Write-Host ""
Write-Host "7. Testing Rooms Routes..." -ForegroundColor Yellow

# Test GET /api/rooms
try {
    $response = Invoke-RestMethod -Uri "$baseUri/rooms" -Method GET
    Write-Host "✓ Get Rooms: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Rooms: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 8: Shifts Routes
Write-Host ""
Write-Host "8. Testing Shifts Routes..." -ForegroundColor Yellow

# Test GET /api/shifts
try {
    $response = Invoke-RestMethod -Uri "$baseUri/shifts" -Method GET
    Write-Host "✓ Get Shifts: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Shifts: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 9: Assignments Routes
Write-Host ""
Write-Host "9. Testing Assignments Routes..." -ForegroundColor Yellow

# Test GET /api/assignments
try {
    $response = Invoke-RestMethod -Uri "$baseUri/assignments" -Method GET
    Write-Host "✓ Get Assignments: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Assignments: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 10: Timetable Routes
Write-Host ""
Write-Host "10. Testing Timetable Routes..." -ForegroundColor Yellow

# Test GET /api/timetable
try {
    $response = Invoke-RestMethod -Uri "$baseUri/timetable" -Method GET
    Write-Host "✓ Get Timetable: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get Timetable: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 11: DOS Routes
Write-Host ""
Write-Host "11. Testing DOS Routes..." -ForegroundColor Yellow

# Test GET /api/dos
try {
    $response = Invoke-RestMethod -Uri "$baseUri/dos" -Method GET
    Write-Host "✓ Get DOS: Success" -ForegroundColor Green
} catch {
    Write-Host "✗ Get DOS: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 12: Error Handling
Write-Host ""
Write-Host "12. Testing Error Handling..." -ForegroundColor Yellow

# Test 404
try {
    $response = Invoke-RestMethod -Uri "$baseUri/nonexistent" -Method GET
    Write-Host "✗ 404 Test: Should have failed" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✓ 404 Error Handling: Working correctly" -ForegroundColor Green
    } else {
        Write-Host "✗ 404 Error Handling: Unexpected error" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== API Testing Complete ===" -ForegroundColor Green
