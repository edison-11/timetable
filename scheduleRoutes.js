const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../authMiddleware');

// @route   GET /api/schedules
// @desc    Get all schedules with details
router.get('/', protect, async (req, res) => {
    try {
        const query = `
            SELECT s.*, m.module_name, u.name as teacher_name, r.room_name, c.class_name
            FROM schedules s
            JOIN modules m ON s.module_id = m.module_id
            JOIN users u ON s.teacher_id = u.id
            JOIN rooms r ON s.room_id = r.id
            JOIN classes c ON s.class_id = c.class_id
            ORDER BY s.day_of_week, s.start_time`;
        const [rows] = await db.execute(query);
        res.json({ schedules: rows });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

router.post('/', protect, async (req, res) => {
    const { module_id, teacher_id, room_id, class_id, day_of_week, start_time, end_time } = req.body;

    try {
        // Conflict Check Query: overlapping time for teacher, room, OR class
        const conflictQuery = `
            SELECT * FROM schedules 
            WHERE day_of_week = ? 
            AND ((start_time < ? AND end_time > ?))
            AND (teacher_id = ? OR room_id = ? OR class_id = ?)`;
        
        const [conflicts] = await db.execute(conflictQuery, 
            [day_of_week, end_time, start_time, teacher_id, room_id, class_id]
        );

        if (conflicts.length > 0) {
            return res.status(400).json({ 
                message: 'Schedule conflict detected!', 
                conflicts 
            });
        }

        const [result] = await db.execute(
            `INSERT INTO schedules (module_id, teacher_id, room_id, class_id, day_of_week, start_time, end_time) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [module_id, teacher_id, room_id, class_id, day_of_week, start_time, end_time]
        );

        res.status(201).json({ message: 'Schedule created', schedule_id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

module.exports = router;