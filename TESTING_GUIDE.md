# 🎯 Quick Start Guide - Testing the System

## Prerequisites
1. Node.js and npm installed
2. MySQL database running
3. All dependencies installed

## Starting the System

### Option 1: Development Mode (Recommended for Testing)
```bash
cd c:\Users\THE 1ST\OneDrive\Desktop\timetable
npm run dev
```
This starts both the backend server and Vue.js development server.

### Option 2: Manual Start
```bash
# Terminal 1 - Start Backend Server
npm run server

# Terminal 2 - Start Frontend Client
npm --prefix client run dev
```

## Accessing the System

### Frontend URL
- **Development:** `http://localhost:5173`
- **Production:** `http://localhost:3000`

### Backend API
- **Base URL:** `http://localhost:5000/api`

## Testing the Loading Bar

The loading bar will appear in these scenarios:

### 1. **Page Navigation**
- Click any navigation link in the admin dashboard
- Watch the top loading bar appear and animate
- The bar shows a multi-layered gradient effect

### 2. **API Requests**
- Perform any action that calls the API:
  - Approve/reject a teacher
  - Load timetable data
  - Fetch notifications
  - Download reports

### 3. **On Startup**
- When you first load the dashboard
- During initial authentication check
- The loading bar shows for ~650ms

## Testing the Admin Approval System

### Step-by-Step Test Workflow:

#### 1. **Login as Admin**
```
Email: admin@school.com
Password: Admin@123456
URL: http://localhost:5173/login
```

#### 2. **Register a Test Teacher**
```
Option A: Use existing test endpoint
- POST /api/teachers/register-test
- Creates: test.teacher@example.com / password123

Option B: Manual Registration
- Go to `/register` page
- Select "Register as Teacher"
- Fill in form details
- Submit
```

#### 3. **View Pending Notifications**
1. Login as admin
2. Look for **notification bell icon** (🔔) in top right navbar
3. You'll see a red badge with pending count
4. Click the bell to open notifications dropdown

#### 4. **Approve or Reject**
1. In the notifications dropdown, find the pending teacher
2. You'll see two buttons:
   - ✅ **Approve** (green button)
   - ❌ **Reject** (red button)
3. Click **Approve**
4. A confirmation dialog appears
5. Confirm the action
6. Teacher status updates to "active"
7. Notification refreshes automatically

#### 5. **Verify Success**
1. Go to **Teachers** page in admin dashboard
2. Search for the approved teacher
3. Status should show: **Active**
4. Action buttons change to: Edit, Delete

## Testing Teacher Dashboard Features

### After Teacher Approval:

1. **Login as Teacher**
   - Use the teacher email you registered
   - Use the password you set

2. **View Dashboard**
   - Clean, minimized layout
   - 4 metric cards (Periods, Subjects, Empty Slots, Rooms)
   - Weekly timetable

3. **Test Export Functions**
   - Click CSV button (hover shows tooltip)
   - Click Excel button (hover shows tooltip)
   - Click Print button (hover shows tooltip)
   - Click Settings button (gear icon)

4. **Dashboard Settings**
   - Display: Dark Mode, Compact View, Metrics, Sidebar
   - Export: Classes, Rooms, Times, Format
   - Calendar: Start Day, Breaks, Highlight Today, 24-Hour Time
   - Notifications: Various notification preferences
   - Availability: Set available days and times

## Loading Bar Features

### Visual Design:
- **Primary Bar:** Blue to cyan gradient, main animation
- **Secondary Bar:** Purple/pink accent layer
- **Tertiary Bar:** Yellow/cyan accent layer
- **Particles:** 5 floating white particles bouncing along
- **Text:** "Loading..." with bouncing letters
- **Glow:** Pulsing box-shadow effect

### Animation Details:
- **Duration:** 1.5s - 2.5s per cycle
- **Transitions:** Smooth cubic-bezier easing
- **Glow Effect:** Pulsing every 2 seconds
- **Opacity:** Fades in/out smoothly

## Testing Notifications System

### Create Test Notifications:
```javascript
// In browser console, after login:
// This is just for demonstration
// Actual notifications are created automatically
```

### Real Notifications Appear For:
- ✅ Pending teacher registrations
- ✅ Teacher approvals
- ✅ Teacher rejections
- ✅ Timetable updates
- ✅ System messages

## API Endpoints for Testing

### Teacher Approval (Test Endpoints)
```
POST /api/teachers/register-test
- Creates test teacher automatically
- Returns: { teacher_id, email, password, status: 'pending' }

PUT /api/teachers/:id/approve
- Requires admin auth
- Updates teacher status to 'active'

DELETE /api/teachers/:id/reject
- Requires admin auth
- Deletes pending teacher application

PUT /api/teachers/:id/approve-test
- No auth required (testing only)
```

### Notifications
```
GET /api/notifications?limit=8
- Fetches recent notifications
- Includes pending teacher notifications

GET /api/pending/teachers
- Gets all pending teachers
- No auth required

DELETE /api/notifications/:id
- Deletes specific notification

DELETE /api/notifications
- Clears all notifications
```

## Common Issues & Solutions

### Loading bar not showing?
1. Check browser console for errors
2. Verify API requests are being made (Network tab)
3. Check loading store is in state (Vue DevTools)
4. Ensure TopLoadingBar component is mounted in App.vue

### Approve button doesn't work?
1. Verify you're logged in as admin
2. Check teacher status is "pending"
3. Look for error in console
4. Try refreshing page and trying again

### Notifications not appearing?
1. Refresh notifications: Click bell icon
2. Check if database has pending teachers
3. Verify notifications endpoint is working

### Teacher can't login after approval?
1. Verify teacher status is 'active' in database
2. Check password is correct
3. Try registering new test teacher
4. Check JWT secret is set correctly

## Database Reset (If Needed)

```bash
# Reset and reseed database
npm run db:reset-academic

# Or run migrations
npm run db:migrate
```

## Testing Checklist

- [ ] Admin can login
- [ ] Loading bar appears on navigation
- [ ] Loading bar appears on API requests
- [ ] Notification bell shows pending count
- [ ] Approve button works from notification dropdown
- [ ] Reject button works with confirmation dialog
- [ ] Teacher status changes after approval
- [ ] Teacher can login after approval
- [ ] Teacher dashboard loads with minimized text
- [ ] Export buttons work (CSV, Excel)
- [ ] Settings tabs are functional
- [ ] Settings descriptions are shortened
- [ ] Dark mode toggle works
- [ ] Notifications refresh after action
- [ ] Alert appears on approval/rejection errors

## Next Steps

1. **Test User Flow:** Register → Wait → Approve → Login
2. **Test Mobile:** Check responsive design on phone
3. **Test Performance:** Monitor loading times
4. **Test Security:** Verify unauthenticated users can't access admin areas
5. **Test Edge Cases:** What happens with special characters in names?

## Need Help?

Check the main `LOGIN_CREDENTIALS.md` file for more detailed information about:
- Complete workflow examples
- Account types and features
- Security features
- Troubleshooting guide

---

**Last Updated:** May 2026
**Testing Version:** 1.0.0
