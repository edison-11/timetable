const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../authMiddleware');
const bcrypt = require('bcryptjs');

// @route   GET /api/teachers
// @desc    Get all teachers
router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id AS teacher_id, name, email, role, status FROM users WHERE role = "teacher"');
        res.json({ teachers: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/teachers/active
// @desc    Get only active teachers (for dropdowns)
router.get('/active', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT id AS teacher_id, name FROM users WHERE role = "teacher" AND status = "active"');
        res.json({ teachers: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/teachers/register
// @desc    Public route for teacher self-registration
router.post('/register', async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.execute(
            'INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, "teacher", "pending")',
            [name, email, hashedPassword]
        );
        res.status(201).json({ message: 'Registration successful, pending approval', teacher_id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/teachers/:id/approve
// @desc    Approve a teacher
router.put('/:id/approve', protect, async (req, res) => {
    try {
        await db.execute('UPDATE users SET status = "active" WHERE id = ?', [req.params.id]);
        res.json({ message: 'Teacher approved' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/teachers/:id
// @desc    Update teacher details
router.put('/:id', protect, async (req, res) => {
    const { name, email, status } = req.body;
    try {
        const [result] = await db.execute(
            'UPDATE users SET name = ?, email = ?, status = ? WHERE id = ? AND role = "teacher"',
            [name, email, status, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Teacher not found' });
        }

        res.json({ message: 'Teacher updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;