const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../authMiddleware');

// @route   GET /api/pending
// @desc    Get all users waiting for approval
router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id, name, email, role FROM users WHERE status = "pending"');
        res.json({ pending_users: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/pending/teachers
router.get('/teachers', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id AS teacher_id, name, email FROM users WHERE role = "teacher" AND status = "pending"');
        res.json({ pendingTeachers: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/pending/approve/:id
// @desc    Approve a user account
router.put('/approve/:id', protect, async (req, res) => {
    try {
        const [result] = await db.execute(
            'UPDATE users SET status = "active" WHERE id = ?',
            [req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User approved and activated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;