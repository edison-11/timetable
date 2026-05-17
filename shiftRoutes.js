const express = require('express');
const router = express.Router();
const db = require('./db');
const { protect } = require('./authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM shifts');
        res.json({ shifts: rows });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;