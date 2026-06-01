const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const teacherAuthRoutes = require('./routes/teacher-auth');
const emailRoutes = require('./routes/email');
const dosRoutes = require('./routes/dos');
const teacherRoutes = require('./routes/teachers');
const moduleRoutes = require('./routes/modules');
const sectionRoutes = require('./routes/sections');
const classRoutes = require('./routes/classes');
const roomRoutes = require('./routes/rooms');
const shiftRoutes = require('./routes/shifts');
const breakRoutes = require('./routes/breaks');
const assignmentRoutes = require('./routes/assignments');
const timetableRoutes = require('./routes/timetable');
const uploadRoutes = require('./routes/upload');
const pendingRoutes = require('./routes/pending');
const settingsRoutes = require('./routes/settings');
const notificationRoutes = require('./routes/notifications');
const announcementRoutes = require('./routes/announcements');
const absenceRoutes = require('./routes/absence');
const substitutionRoutes = require('./routes/substitution');
const studentRoutes = require('./routes/students');
const teacherStudentRoutes = require('./routes/teacher-students');
const dashboardRoutes = require('./routes/dashboard');
const schoolRoutes = require('./routes/schools');
const externalAuthRoutes = require('./routes/externalAuth');
const { adminAuth } = require('./middleware/adminAuth');
const { requireSchoolAdmin } = require('./middleware/rbac');

const app = express();

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 10000 : 100 // keep local development from blocking normal testing
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const clientDistPath = path.resolve(__dirname, '../client/dist');
const clientSourcePath = path.resolve(__dirname, '../client');
const clientAppPath = fs.existsSync(clientDistPath) ? clientDistPath : clientSourcePath;

app.use(express.static(clientAppPath, {
  setHeaders: (res, filePath) => {
    if (path.basename(filePath) === 'index.html') {
      res.setHeader('Cache-Control', 'no-store');
    }
  }
}));
if (!fs.existsSync(clientDistPath)) {
  console.warn(`Warning: client dist folder not found at ${clientDistPath}`);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api/auth/external', externalAuthRoutes);
app.use('/api/teacher-auth', teacherAuthRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/dos', dosRoutes);
app.use('/api/teachers', adminAuth, requireSchoolAdmin, teacherRoutes);
app.use('/api/modules', adminAuth, requireSchoolAdmin, moduleRoutes);
app.use('/api/sections', adminAuth, requireSchoolAdmin, sectionRoutes);
app.use('/api/classes', adminAuth, requireSchoolAdmin, classRoutes);
app.use('/api/rooms', adminAuth, requireSchoolAdmin, roomRoutes);
app.use('/api/shifts', adminAuth, requireSchoolAdmin, shiftRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/assignments', adminAuth, requireSchoolAdmin, assignmentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pending', adminAuth, requireSchoolAdmin, pendingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/absence', absenceRoutes);
app.use('/api/substitution', substitutionRoutes);
app.use('/api/teacher-attendance', teacherStudentRoutes);
app.use('/api/students', adminAuth, requireSchoolAdmin, studentRoutes);
app.use('/api/dashboard', adminAuth, requireSchoolAdmin, dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// SPA fallback - serve the built client when available, otherwise the source client shell
app.get('*', (req, res) => {
  if (req.path.startsWith('/assets/')) {
    return res.status(404).send('Asset not found.');
  }

  const indexPath = path.join(clientAppPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.setHeader('Cache-Control', 'no-store');
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Client files not found.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the existing server or set a different PORT in .env.`);
    process.exit(1);
  }

  console.error(error);
  process.exit(1);
});

module.exports = app;
