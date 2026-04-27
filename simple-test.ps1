# Simple API Test Script
$baseUri = "http://localhost:5000/api"

Write-Host "=== API Tests ===" -ForegroundColor Green

# Test Health
try {
    $response = Invoke-RestMethod -Uri "$baseUri/health" -Method GET
    Write-Host "✓ Health: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Health: Failed" -ForegroundColor Red
}

# Test Teachers
try {
    $response = Invoke-RestMethod -Uri "$baseUri/teachers" -Method GET
    Write-Host "✓ Teachers: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Teachers: Failed" -ForegroundColor Red
}

# Test Modules
try {
    $response = Invoke-RestMethod -Uri "$baseUri/modules" -Method GET
    Write-Host "✓ Modules: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Modules: Failed" -ForegroundColor Red
}

# Test Classes
try {
    $response = Invoke-RestMethod -Uri "$baseUri/classes" -Method GET
    Write-Host "✓ Classes: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Classes: Failed" -ForegroundColor Red
}

# Test Sections
try {
    $response = Invoke-RestMethod -Uri "$baseUri/sections" -Method GET
    Write-Host "✓ Sections: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Sections: Failed" -ForegroundColor Red
}

# Test Rooms
try {
    $response = Invoke-RestMethod -Uri "$baseUri/rooms" -Method GET
    Write-Host "✓ Rooms: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Rooms: Failed" -ForegroundColor Red
}

# Test Shifts
try {
    $response = Invoke-RestMethod -Uri "$baseUri/shifts" -Method GET
    Write-Host "✓ Shifts: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Shifts: Failed" -ForegroundColor Red
}

# Test Assignments
try {
    $response = Invoke-RestMethod -Uri "$baseUri/assignments" -Method GET
    Write-Host "✓ Assignments: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Assignments: Failed" -ForegroundColor Red
}

# Test Timetable
try {
    $response = Invoke-RestMethod -Uri "$baseUri/timetable" -Method GET
    Write-Host "✓ Timetable: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ Timetable: Failed" -ForegroundColor Red
}

# Test DOS
try {
    $response = Invoke-RestMethod -Uri "$baseUri/dos" -Method GET
    Write-Host "✓ DOS: OK" -ForegroundColor Green
} catch {
    Write-Host "✗ DOS: Failed" -ForegroundColor Red
}

Write-Host "=== Tests Complete ===" -ForegroundColor Green
