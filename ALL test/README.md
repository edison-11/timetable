# Test Files Organization

This directory contains all test files for the Timetable Management System, organized by category.

## 📁 Directory Structure

### 🔐 authentication/
- `test-admin-auth-direct.js` - Tests admin authentication directly
- `test-auth-debug.js` - Debug authentication issues

### ✅ approval/
- `test-approve-new-teacher.js` - Tests teacher approval workflow
- `test-approve-sarah.js` - Tests approval for specific teacher
- `test-approve-teacher.js` - General teacher approval tests
- `test-direct-approval-sarah.js` - Direct approval without auth
- `test-direct-approval.js` - Direct approval endpoint tests

### 📝 registration/
- `test-teacher-registration.js` - Basic teacher registration test
- `register-another-teacher.js` - Register additional teacher
- `register-another-teacher-debug.js` - Debug registration issues
- `register-new-teacher.js` - New teacher registration
- `register-and-approve-test.js` - Complete registration and approval workflow

### 🗄️ database/
- `test-db-connection.js` - Database connection tests
- `update-database.js` - Database schema updates
- `create-users-table.js` - Users table creation
- `create-test-user.js` - Test user creation
- `check-admin-user.js` - Admin user verification

### 🐛 debug/
- `debug-approval.js` - Debug approval process
- `performance-test.js` - System performance tests

### 📤 upload/
- `test-file-upload.js` - File upload functionality tests

### 📋 Root Level
- `test-direct-pending.js` - Direct pending teachers endpoint
- `test-new-pending.js` - New pending teachers test
- `test-pending-api.js` - Pending teachers API tests
- `test-pending-no-auth.js` - Pending teachers without authentication

## 🚀 How to Run Tests

1. **Authentication Tests:**
   ```bash
   cd authentication
   node test-admin-auth-direct.js
   ```

2. **Approval Tests:**
   ```bash
   cd approval
   node test-approve-new-teacher.js
   ```

3. **Registration Tests:**
   ```bash
   cd registration
   node test-teacher-registration.js
   ```

4. **Database Tests:**
   ```bash
   cd database
   node test-db-connection.js
   ```

5. **Complete Workflow:**
   ```bash
   cd registration
   node register-and-approve-test.js
   ```

## 📊 Test Coverage

- ✅ **Authentication**: Admin login and token validation
- ✅ **Teacher Registration**: New teacher signup process
- ✅ **Teacher Approval**: Admin approval workflow
- ✅ **Database Operations**: CRUD operations and connections
- ✅ **File Upload**: Profile picture and document uploads
- ✅ **API Endpoints**: All REST API functionality
- ✅ **Error Handling**: Debug and error scenarios

## 🔧 Prerequisites

- Ensure both frontend and backend servers are running
- Database connection should be active
- Admin user should exist in database
- Test environment variables configured

## 📝 Notes

- All tests use the test admin credentials: `test@example.com` / `password123`
- Database operations use the test database schema
- Some tests create temporary data that should be cleaned up
- Performance tests may require additional system resources
