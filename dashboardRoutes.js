const express = require('express');
const router = express.Router();
const db = require('./db');
const { protect } = require('./authMiddleware');

// @route   GET /api/dashboard/stats
// @desc    Get summary statistics for the dashboard
router.get('/stats', protect, async (req, res) => {
    try {
        const [modules] = await db.execute('SELECT COUNT(*) as count FROM modules');
        const [teachers] = await db.execute('SELECT COUNT(*) as count FROM users WHERE role = "teacher"');
        const [classes] = await db.execute('SELECT COUNT(*) as count FROM classes');
        const [sections] = await db.execute('SELECT COUNT(*) as count FROM sections');
        const [pending] = await db.execute('SELECT COUNT(*) as count FROM users WHERE status = "pending"');

        res.json({
            modules: modules[0].count,
            teachers: teachers[0].count,
            classes: classes[0].count,
            sections: sections[0].count,
            pendingUsers: pending[0].count
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching dashboard stats', error: error.message });
    }
});

// @route   GET /api/dashboard/activity
router.get('/activity', protect, async (req, res) => {
    try {
        const activity = [
            { id: 1, type: 'registration', message: 'Teacher "John Doe" registered and is awaiting approval.', time: '1 hour ago' },
            { id: 2, type: 'security', message: 'Admin login detected from new IP address.', time: '2 hours ago' },
            { id: 3, type: 'schedule', message: 'Conflict resolved: Room 101 reassigned for Biology.', time: '5 hours ago' }
        ];
        res.json({ activity });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching activity', error: error.message });
    }
});

module.exports = router;