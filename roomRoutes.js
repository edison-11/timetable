const express = require('express');
const router = express.Router();
const db = require('./db');
const { protect } = require('./authMiddleware');

// @route   GET /api/rooms
router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM rooms');
        res.json({ rooms: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   POST /api/rooms
router.post('/', protect, async (req, res) => {
    const { room_name, capacity } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO rooms (room_name, capacity) VALUES (?, ?)',
            [room_name, capacity]
        );
        res.status(201).json({ message: 'Room created', room_id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   PUT /api/rooms/:id
router.put('/:id', protect, async (req, res) => {
    const { room_name, capacity } = req.body;
    try {
        await db.execute(
            'UPDATE rooms SET room_name = ?, capacity = ? WHERE id = ?',
            [room_name, capacity, req.params.id]
        );
        res.json({ message: 'Room updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route   DELETE /api/rooms/:id
router.delete('/:id', protect, async (req, res) => {
    try {
        await db.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
        res.json({ message: 'Room deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;