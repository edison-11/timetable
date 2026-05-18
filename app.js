const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

// Load environment variables
dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(cookieParser());
app.use(express.static(__dirname));

// Routes
app.use('/api/auth', require('./authRoutes'));
app.use('/api/modules', require('./moduleRoutes'));
app.use('/api/teachers', require('./teacherRoutes'));
app.use('/api/sections', require('./sectionRoutes'));
app.use('/api/schedules', require('./scheduleRoutes'));
app.use('/api/pending', require('./pendingRoutes'));
app.use('/api/classes', require('./classRoutes'));
app.use('/api/shifts', require('./shiftRoutes'));
app.use('/api/dos', require('./dosRoutes'));
app.use('/api/dashboard', require('./dashboardRoutes'));
app.use('/api/rooms', require('./roomRoutes'));

// Test Route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;