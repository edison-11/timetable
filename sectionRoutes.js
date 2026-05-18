const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../authMiddleware');

// @route   GET /api/sections
router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM sections');
        res.json({ sections: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   GET /api/sections/with-count
router.get('/with-count', protect, async (req, res) => {
    try {
        const query = `
            SELECT s.*, (SELECT COUNT(*) FROM classes c WHERE c.section_id = s.section_id) as class_count 
            FROM sections s`;
        const [rows] = await db.execute(query);
        res.json({ sections: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/sections
router.post('/', protect, async (req, res) => {
    const { section_name, level, description } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO sections (section_name, level, description) VALUES (?, ?, ?)',
            [section_name, level, description]
        );
        const [newSection] = await db.execute('SELECT * FROM sections WHERE section_id = ?', [result.insertId]);
        res.status(201).json({ message: 'Section created', section: newSection[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/sections/:id
router.put('/:id', protect, async (req, res) => {
    const { section_name, level, description } = req.body;
    try {
        await db.execute(
            'UPDATE sections SET section_name = ?, level = ?, description = ? WHERE section_id = ?',
            [section_name, level, description, req.params.id]
        );
        const [updated] = await db.execute('SELECT * FROM sections WHERE section_id = ?', [req.params.id]);
        res.json({ message: 'Section updated', section: updated[0] });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/sections/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        await db.execute('DELETE FROM sections WHERE section_id = ?', [req.params.id]);
        res.json({ message: 'Section deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;