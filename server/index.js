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
const absenceRoutes = require('./routes/absence');
const substitutionRoutes = require('./routes/substitution');
const studentRoutes = require('./routes/students');
const dashboardRoutes = require('./routes/dashboard');
const { adminAuth } = require('./middleware/adminAuth');

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

app.use(express.static(clientAppPath));
if (!fs.existsSync(clientDistPath)) {
  console.warn(`Warning: client dist folder not found at ${clientDistPath}`);
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher-auth', teacherAuthRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/dos', dosRoutes);
app.use('/api/teachers', adminAuth, teacherRoutes);
app.use('/api/modules', adminAuth, moduleRoutes);
app.use('/api/sections', adminAuth, sectionRoutes);
app.use('/api/classes', adminAuth, classRoutes);
app.use('/api/rooms', adminAuth, roomRoutes);
app.use('/api/shifts', adminAuth, shiftRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/assignments', adminAuth, assignmentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pending', pendingRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/absence', absenceRoutes);
app.use('/api/substitution', substitutionRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/dashboard', adminAuth, dashboardRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// SPA fallback - serve the built client when available, otherwise the source client shell
app.get('*', (req, res) => {
  const indexPath = path.join(clientAppPath, 'index.html');
  if (fs.existsSync(indexPath)) {
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
