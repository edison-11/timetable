const express = require('express');
const router = express.Router();
const db = require('./db');
const { protect } = require('./authMiddleware');

// @route   GET /api/classes
router.get('/', protect, async (req, res) => {
    try {
        const query = `
            SELECT c.*, u.name as class_teacher_name, s.shift_name, sec.section_name, d.dos_name
            FROM classes c
            LEFT JOIN users u ON c.class_teacher_id = u.id
            LEFT JOIN shifts s ON c.shift_id = s.shift_id
            LEFT JOIN sections sec ON c.section_id = sec.section_id
            LEFT JOIN dos d ON c.dos_id = d.dos_id`;
        const [rows] = await db.execute(query);
        res.json({ classes: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/classes
router.post('/', protect, async (req, res) => {
    const { class_name, level, academic_year, class_teacher_id, shift_id, section_id, dos_id } = req.body;
    try {
        const [result] = await db.execute(
            `INSERT INTO classes (class_name, level, academic_year, class_teacher_id, shift_id, section_id, dos_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [class_name, level, academic_year, class_teacher_id, shift_id, section_id, dos_id]
        );
        res.status(201).json({ message: 'Class created', class: { class_id: result.insertId } });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/classes/:id
router.put('/:id', protect, async (req, res) => {
    const fields = req.body;
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    
    if (keys.length === 0) return res.status(400).json({ message: 'No fields to update' });

    const setClause = keys.map(key => `${key} = ?`).join(', ');
    try {
        await db.execute(`UPDATE classes SET ${setClause} WHERE class_id = ?`, [...values, req.params.id]);
        res.json({ message: 'Class updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/classes/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        await db.execute('DELETE FROM classes WHERE class_id = ?', [req.params.id]);
        res.json({ message: 'Class deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;