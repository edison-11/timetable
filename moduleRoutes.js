const express = require('express');
const router = express.Router();
const db = require('../db');
const { protect } = require('../authMiddleware');

router.get('/', protect, async (req, res) => {
    try {
        const [rows] = await db.execute('SELECT * FROM modules');
        res.json({ modules: rows });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/', protect, async (req, res) => {
    const { module_name, hours_per_year, description } = req.body;
    try {
        const [result] = await db.execute(
            'INSERT INTO modules (module_name, hours_per_year, description) VALUES (?, ?, ?)',
            [module_name, hours_per_year, description]
        );
        res.status(201).json({ message: 'Created', module_id: result.insertId });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.put('/:id', protect, async (req, res) => {
    const { module_name, hours_per_year, description } = req.body;
    try {
        await db.execute(
            'UPDATE modules SET module_name = ?, hours_per_year = ?, description = ? WHERE module_id = ?',
            [module_name, hours_per_year, description, req.params.id]
        );
        res.json({ message: 'Updated' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        await db.execute('DELETE FROM modules WHERE module_id = ?', [req.params.id]);
        res.json({ message: 'Deleted' });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

module.exports = router;