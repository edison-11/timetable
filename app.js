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
app.use('/api/auth', require('./server/routes/auth'));
app.use('/api/modules', require('./server/routes/modules'));
app.use('/api/teachers', require('./server/routes/teachers'));
app.use('/api/sections', require('./server/routes/sections'));
app.use('/api/pending', require('./server/routes/pending'));
app.use('/api/classes', require('./server/routes/classes'));
app.use('/api/shifts', require('./server/routes/shifts'));
app.use('/api/dos', require('./server/routes/dos'));
app.use('/api/dashboard', require('./server/routes/dashboard'));
app.use('/api/rooms', require('./server/routes/rooms'));
app.use('/api/timetable', require('./server/routes/timetable'));
app.use('/api/teacher-auth', require('./server/routes/teacher-auth'));

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