const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const teacherAuthRoutes = require('./routes/teacher-auth');
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

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const fs = require('fs');

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const clientDistPath = path.resolve(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
} else {
  console.warn(`Warning: client dist folder not found at ${clientDistPath}`);
}

// MySQL connection test
const pool = require('./config/database');
pool.getConnection()
  .then(connection => {
    console.log('MySQL connected successfully');
    connection.release();
  })
  .catch(err => console.error('MySQL connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/teacher-auth', teacherAuthRoutes);
app.use('/api/dos', dosRoutes);
app.use('/api/teachers', teacherRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/sections', sectionRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/breaks', breakRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/pending', pendingRoutes);
app.use('/api/settings', settingsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// SPA fallback - serve index.html for client-side routing
app.get('*', (req, res) => {
  const indexPath = path.join(clientDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Frontend build not found. Run `npm install` and `npm run build` in the client folder.');
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
