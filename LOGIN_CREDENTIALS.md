# 🔐 Timetable System - Login Credentials

## System Overview
This is a comprehensive Timetable Management System with role-based access control for:
- **Super Admin**: Full system management and teacher approval
- **Teachers**: Personal dashboard, timetable, and profile management
- **DOS (Director of Studies)**: Academic management
- **Students**: View their timetables

---

## 🚀 Quick Start

### Default Admin Account
After initial setup, use these credentials to login:

**Email:** `admin@school.com`  
**Password:** `Admin@123456`

**Role:** Super Admin

---

## 📋 Account Types & Features

### Super Admin
- ✅ Approve/Reject teacher registrations
- ✅ Manage all teachers, DOS, students
- ✅ View all notifications
- ✅ Access admin dashboard
- ✅ Manage system settings
- ✅ View approval buttons in notifications

**Sample Admin Account:**
```
Email: admin@school.com
Password: Admin@123456
```

### Teacher
- ✅ View personal timetable
- ✅ Download timetable (CSV, Excel, PDF)
- ✅ Manage dashboard settings
- ✅ View notifications
- ✅ Update profile
- ✅ Register and wait for admin approval

### DOS (Director of Studies)
- ✅ Manage academic content
- ✅ View all timetables
- ✅ Approve/manage schedules
- ✅ Dashboard access

### Student
- ✅ View personal timetable
- ✅ View class schedule
- ✅ Access basic information

---

## 🔑 How to Create New Accounts

### Method 1: Teacher Registration (Self-Registration)
1. Go to `/register` page
2. Select "Register as Teacher"
3. Fill in the form:
   - Name, Email, Password
   - Department (SSOD, SSC, STEM, Humanities, Arts, Sciences, Other)
   - Teaching Subject(s)
   - Contact Information
4. Submit form
5. **Status:** Account will be in "PENDING" state
6. **Admin Action Required:** Super Admin must approve from:
   - Dashboard Notifications panel
   - Notification bell icon (Approve/Reject buttons)
   - Teachers management page

### Method 2: Admin Direct Creation (Future Feature)
Contact your system administrator to create accounts directly.

---

## 🎯 Admin Approval Workflow

### For Super Admin - Approving Teachers:

#### Option 1: Via Notification Bell (Quick Action)
1. Click the **🔔 Notification Bell** in the top right
2. Find the pending teacher in the list
3. Click **"Approve"** or **"Reject"** button
4. Confirmation dialog will appear
5. Teacher receives notification of their approval status

#### Option 2: Via Teachers Page
1. Go to **Admin Dashboard** → **Teachers**
2. Filter by Status: **"Pending"**
3. Click **"Approve"** or **"Reject"** for each teacher
4. System will update their status

#### Option 3: Via Dashboard Notifications
1. Go to **Dashboard** → Scroll to **Notifications** section
2. View all pending teachers
3. Click approve/reject actions

### Notification Features:
- ✅ Real-time pending teacher notifications
- ✅ Quick approve/reject buttons
- ✅ Confirmation dialog for safety
- ✅ Toast notifications for success/error
- ✅ Automatic notification cleanup

---

## 📊 Teacher Dashboard - Minimized Design

The teacher dashboard has been optimized with:
- ✅ **Compact metrics** - Shows key stats with minimal text
- ✅ **Icon-only buttons** - Clean toolbar with tooltips
- ✅ **Abbreviated settings** - Short labels and descriptions
- ✅ **Quick actions** - Download, Print, Refresh with icons only
- ✅ **Clean layout** - Removed verbose descriptions

### Dashboard Features:
- 📊 4 Metric Cards (Periods, Subjects, Empty Slots, Rooms)
- 📅 Weekly Timetable View
- 🔧 5 Settings Tabs: Display, Export, Calendar, Notifications, Availability
- ⬇️ Download Options: CSV, Excel, PDF
- 🖨️ Print Support
- 🔄 Auto-refresh

---

## ⚡ Loading Bar

A beautiful, animated loading bar appears:
- ✅ When navigating between pages
- ✅ During API requests
- ✅ While loading timetable data
- ✅ On system startup

**Features:**
- 🎨 Multi-layered gradient design
- ✨ Smooth transitions and animations
- 🎭 Floating particles effect
- 📝 "Loading..." text with bouncing letters
- 💫 Pulsing glow effect

---

## 🔄 Complete Workflow Example

### Step 1: New Teacher Registers
1. Visit system → Click "Register"
2. Select "Register as Teacher"
3. Fill in details
4. Submit form
5. System shows: "Your teacher account is waiting for admin approval"

### Step 2: Admin Gets Notification
1. Admin sees notification badge (red dot with count)
2. Clicks notification bell
3. Sees pending teacher with name and email
4. Has **Approve** and **Reject** buttons ready

### Step 3: Admin Approves Teacher
1. Clicks **"Approve"** button
2. Confirmation dialog appears
3. Clicks **"Approve"** in dialog
4. System updates teacher status to "active"
5. Admin and teacher both get notifications

### Step 4: Teacher Can Login
1. Teacher receives approval notification
2. Can now login with their credentials
3. Access full dashboard and features

---

## 🛡️ Security Features

- ✅ Password hashing with bcryptjs
- ✅ JWT token authentication
- ✅ Role-based access control
- ✅ Secure session management
- ✅ Protected API endpoints
- ✅ Email verification (optional)

---

## 🐛 Troubleshooting

### "Invalid credentials" error
- Ensure email and password are correct
- Check for extra spaces before/after email
- Verify admin account exists in database

### Cannot approve teachers
- Verify you're logged in as Super Admin
- Check that teacher status is "pending"
- Ensure you have admin permissions

### Loading bar not showing
- Check browser console for errors
- Verify API requests are being made
- Ensure loading store is active

### Teacher dashboard looks different
- Text has been minimized for cleaner UI
- Use tooltips (hover over buttons) for help
- Settings section shows abbreviated labels

---

## 📱 Account Credentials Summary

| Role | Email | Password | Features |
|------|-------|----------|----------|
| Super Admin | admin@school.com | Admin@123456 | Full system control, approvals |
| Teacher | Register on site | Your password | Dashboard, timetable, settings |
| DOS | Contact admin | - | Academic management |
| Student | Contact admin | - | View timetables |

---

## ✨ Recent Improvements

### v1.0 Updates:
- ✨ **Fancy Loading Bar**: Multi-layer animations with particles and glow effects
- 🎯 **Streamlined Text**: Minimized words on teacher dashboard for better UX
- 🔔 **Easy Approvals**: Quick approve/reject buttons in notifications
- 📊 **Clean Dashboard**: Compact metrics display
- ⚡ **Better Performance**: Optimized loading states

---

## 📞 Support

For issues or questions:
1. Check this guide
2. Review dashboard notifications
3. Contact system administrator

---

**Last Updated:** May 2026  
**System Version:** 1.0.0
